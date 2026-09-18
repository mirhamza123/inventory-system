import mongoose from "mongoose";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

export const createSale = async (req, res) => {
  const { items, paymentMethod = "cash" } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one sale item is required" });
  }

  const normalizedItems = items.map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
    saleType: item.saleType === "Wholesale" ? "Wholesale" : "Retail",
  }));

  if (
    normalizedItems.some(
      (item) =>
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    return res
      .status(400)
      .json({
        message: "Each item needs a valid product and positive quantity",
      });
  }

  const quantitiesByProduct = normalizedItems.reduce((result, item) => {
    result[item.productId] = (result[item.productId] || 0) + item.quantity;
    return result;
  }, {});
  const session = await mongoose.startSession();

  try {
    let createdTransactions = [];
    await session.withTransaction(async () => {
      const productIds = Object.keys(quantitiesByProduct);
      const products = await Product.find({
        _id: { $in: productIds },
        isDeleted: false,
      }).session(session);
      const productMap = new Map(
        products.map((product) => [String(product._id), product]),
      );

      for (const [productId, quantity] of Object.entries(quantitiesByProduct)) {
        const product = productMap.get(productId);
        if (!product) {
          const error = new Error("Product not found");
          error.statusCode = 404;
          throw error;
        }
        if (product.quantity < quantity) {
          const error = new Error(`Insufficient stock for ${product.name}`);
          error.statusCode = 400;
          throw error;
        }
      }

      const decrementOperations = Object.entries(quantitiesByProduct).map(
        ([productId, quantity]) => ({
          updateOne: {
            filter: {
              _id: productId,
              isDeleted: false,
              quantity: { $gte: quantity },
            },
            update: { $inc: { quantity: -quantity } },
          },
        }),
      );
      const decrementResult = await Product.bulkWrite(decrementOperations, {
        session,
      });
      if (decrementResult.modifiedCount !== decrementOperations.length) {
        const error = new Error(
          "Stock changed while completing the sale; please retry",
        );
        error.statusCode = 409;
        throw error;
      }

      const transactionDocuments = normalizedItems.map((item) => {
        const product = productMap.get(String(item.productId));
        const sellingPrice =
          item.saleType === "Wholesale"
            ? product.wholesalePrice || product.price
            : product.retailPrice || product.price;
        const unitProfit = sellingPrice - (product.purchasePrice || 0);

        return {
          product: product._id,
          productName: product.name,
          purchasePrice: product.purchasePrice || 0,
          type: "stock-out",
          quantity: item.quantity,
          reason: `POS sale (${paymentMethod})`,
          saleType: item.saleType,
          sellingPrice,
          unitProfit,
          totalProfit: unitProfit * item.quantity,
        };
      });
      createdTransactions = await Transaction.insertMany(transactionDocuments, {
        session,
      });
    });

    res
      .status(201)
      .json({ message: "Sale completed", transactions: createdTransactions });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};
