import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Transaction from "../models/Transaction.js";
import Invoice from "../models/Invoice.js";

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

export const getStockActivities = async (req, res) => {
  try {
    const { startDate, endDate, showAllHistory } = req.query;
    const filter = {
      $or: [
        { source: "stock-in-out" },
        { source: { $exists: false }, supplier: null },
      ],
    };

    if (!["true", "1"].includes(String(showAllHistory).toLowerCase())) {
      if (startDate || endDate) {
        filter.createdAt = {};
      }

      if (startDate) {
        const parsedStart = new Date(startDate);
        if (Number.isNaN(parsedStart.getTime())) {
          return res.status(400).json({ message: "Invalid startDate" });
        }
        parsedStart.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = parsedStart;
      }

      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ message: "Invalid endDate" });
        }
        parsedEnd.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = parsedEnd;
      }
    }

    const activities = await Transaction.find(filter)
      .populate("product")
      .sort({ createdAt: -1 });
    res.json(activities);
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
      customerName,
      discount = 0,
      discountType = "fixed",
      discountValue = 0,
    } = req.body;

    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ message: "Missing transaction fields" });
    }

    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const normalizedDiscountType =
      discountType === "percent" ? "percent" : "fixed";
    const requestedDiscountValue = Number(discountValue ?? discount ?? 0);
    const requestedDiscount = Number(discount ?? 0);
    if (
      !Number.isFinite(requestedDiscountValue) ||
      requestedDiscountValue < 0 ||
      !Number.isFinite(requestedDiscount) ||
      requestedDiscount < 0
    ) {
      return res
        .status(400)
        .json({ message: "Discount must be zero or greater" });
    }

    if (
      type === "stock-out" &&
      normalizedDiscountType === "percent" &&
      requestedDiscountValue > 100
    ) {
      return res
        .status(400)
        .json({ message: "Percentage discount cannot exceed 100%" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (type === "stock-out" && product.quantity < normalizedQuantity) {
      return res
        .status(400)
        .json({ message: "Insufficient stock for stock out" });
    }

    const delta =
      type === "stock-in" ? normalizedQuantity : -normalizedQuantity;
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
      const grossRevenue = Number(sellingPrice || 0) * normalizedQuantity;
      const normalizedDiscountValue = Math.max(0, requestedDiscountValue);
      const normalizedDiscount = requestedDiscount;
      const safeDiscount =
        normalizedDiscountType === "percent"
          ? (Math.min(Math.max(normalizedDiscountValue, 0), 100) / 100) *
            grossRevenue
          : Math.min(normalizedDiscount, grossRevenue);
      const finalAmount = Math.max(grossRevenue - safeDiscount, 0);
      const unitProfit = sellingPrice - (product.purchasePrice || 0);
      const totalProfit = unitProfit * normalizedQuantity;

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
      source: "stock-in-out",
      product: productId,
      productName: product.name,
      customerName:
        type === "stock-out"
          ? String(customerName || "Walk-in Customer").trim()
          : "Walk-in Customer",
      purchasePrice: product.purchasePrice || 0,
      type,
      quantity: normalizedQuantity,
      reason,
      ...saleMetadata,
    });

    let invoice;
    if (type === "stock-out") {
      try {
        invoice = await Invoice.create({
          transaction: transaction._id,
          legacyId: String(transaction._id),
          customerName: transaction.customerName,
          productName: product.name,
          quantity: normalizedQuantity,
          price: saleMetadata.sellingPrice,
          discount: saleMetadata.discount,
          discountType: saleMetadata.discountType || "fixed",
          discountValue: saleMetadata.discountValue || 0,
          netTotal: saleMetadata.finalAmount,
          createdAt: transaction.createdAt,
        });
      } catch (error) {
        await Transaction.findByIdAndDelete(transaction._id);
        product.quantity -= delta;
        await product.save();
        throw error;
      }
    }

    res.status(201).json({
      ...transaction.toObject(),
      invoiceId: invoice?._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.type === "stock-in" && transaction.supplier) {
      const supplier = await Supplier.findById(transaction.supplier);
      if (supplier) {
        supplier.totalPurchased = Math.max(
          Number(supplier.totalPurchased || 0) -
            Number(transaction.totalAmount || 0),
          0,
        );
        supplier.totalPaid = Math.max(
          Number(supplier.totalPaid || 0) -
            Number(transaction.amountPaidNow || 0),
          0,
        );
        supplier.totalPayable = Math.max(
          supplier.totalPurchased - supplier.totalPaid,
          0,
        );
        await supplier.save();
      }
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase history deleted successfully" });
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
