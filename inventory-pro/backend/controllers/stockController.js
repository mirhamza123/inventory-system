import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

export const getTransactions = async (_req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("product")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      productId,
      type,
      quantity,
      reason,
      saleType,
      discount = 0,
      discountType = "fixed",
      discountValue = 0,
    } = req.body;

    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ message: "Missing transaction fields" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (type === "stock-out" && product.quantity < quantity) {
      return res
        .status(400)
        .json({ message: "Insufficient stock for stock out" });
    }

    const delta = type === "stock-in" ? quantity : -quantity;
    product.quantity += delta;
    await product.save();

    let saleMetadata = {
      sellingPrice: 0,
      unitProfit: 0,
      totalProfit: 0,
      saleType: undefined,
      discount: 0,
      finalAmount: 0,
    };

    if (type === "stock-out") {
      const resolvedSaleType =
        saleType === "Wholesale" ? "Wholesale" : "Retail";
      const sellingPrice =
        resolvedSaleType === "Wholesale"
          ? product.wholesalePrice || product.price
          : product.retailPrice || product.price;
      const grossRevenue = Number(sellingPrice || 0) * Number(quantity || 0);
      const normalizedDiscountType =
        discountType === "percent" ? "percent" : "fixed";
      const normalizedDiscountValue = Math.max(
        0,
        Number(discountValue ?? discount ?? 0) || 0,
      );
      const normalizedDiscount = Math.max(0, Number(discount) || 0);
      const safeDiscount =
        normalizedDiscountType === "percent"
          ? (Math.min(Math.max(normalizedDiscountValue, 0), 100) / 100) *
            grossRevenue
          : Math.min(normalizedDiscount, grossRevenue);
      const finalAmount = Math.max(grossRevenue - safeDiscount, 0);
      const unitProfit = sellingPrice - (product.purchasePrice || 0);
      const totalProfit = unitProfit * quantity;

      saleMetadata = {
        saleType: resolvedSaleType,
        sellingPrice,
        unitProfit,
        totalProfit,
        discountType: normalizedDiscountType,
        discountValue: normalizedDiscountValue,
        discount: safeDiscount,
        finalAmount,
      };
    }

    const transaction = await Transaction.create({
      product: productId,
      productName: product.name,
      purchasePrice: product.purchasePrice || 0,
      type,
      quantity,
      reason,
      ...saleMetadata,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTotalNetProfit = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { type: "stock-out" };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (Number.isNaN(parsedStart.getTime())) {
          return res.status(400).json({ message: "Invalid startDate" });
        }
        filter.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ message: "Invalid endDate" });
        }
        filter.createdAt.$lte = parsedEnd;
      }
    }

    const transactions = await Transaction.find(filter).populate("product");
    const totalNetProfit = transactions.reduce((sum, transaction) => {
      const baseProfit =
        transaction.totalProfit ??
        ((transaction.sellingPrice || 0) -
          (transaction.purchasePrice ||
            transaction.product?.purchasePrice ||
            0)) *
          (transaction.quantity || 0);
      const adjustedProfit = Math.max(
        (Number(baseProfit) || 0) - (Number(transaction.discount) || 0),
        0,
      );
      return sum + adjustedProfit;
    }, 0);

    res.json({ totalNetProfit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
