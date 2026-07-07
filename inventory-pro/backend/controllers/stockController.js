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
    const { productId, type, quantity, reason } = req.body;

    if (!productId || !type || !quantity) {
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

    const transaction = await Transaction.create({
      product: productId,
      type,
      quantity,
      reason,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
