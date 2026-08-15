import Product from "../models/Product.js";

export const getProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const buildExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return { status: "VALID", kind: "fresh" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return { status: "VALID", kind: "fresh" };
  }

  const diffInDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return { status: "EXPIRED", kind: "expired" };
  }

  if (diffInDays <= 30) {
    return { status: "EXPIRING SOON", kind: "expiringSoon" };
  }

  return { status: "VALID", kind: "fresh" };
};

export const getProductAlerts = async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertWindow = new Date(today);
    alertWindow.setDate(alertWindow.getDate() + 30);

    const products = await Product.find({
      isDeleted: false,
      expiryDate: { $ne: null, $lte: alertWindow },
    }).sort({ expiryDate: 1 });

    const expired = products.filter((product) => {
      const expiryDate = new Date(product.expiryDate);
      return expiryDate < today;
    });

    const expiringSoon = products.filter((product) => {
      const expiryDate = new Date(product.expiryDate);
      return expiryDate >= today && expiryDate <= alertWindow;
    });

    const payload = products.map((product) => ({
      ...product.toObject(),
      expiryStatus: buildExpiryStatus(product.expiryDate),
    }));

    res.json({
      expired,
      expiringSoon,
      all: payload,
      total: expired.length + expiringSoon.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      sku,
      purchasePrice,
      retailPrice,
      wholesalePrice,
      quantity,
      category,
      status,
      expiryDate,
    } = req.body;

    if (
      !name ||
      !sku ||
      purchasePrice === undefined ||
      retailPrice === undefined ||
      wholesalePrice === undefined ||
      quantity === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Missing required product fields" });
    }

    const product = await Product.create({
      name,
      brand,
      sku,
      purchasePrice: Number(purchasePrice),
      retailPrice: Number(retailPrice),
      wholesalePrice: Number(wholesalePrice),
      price: Number(retailPrice),
      quantity: Number(quantity),
      category,
      status,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.brand !== undefined) product.brand = req.body.brand;
    if (req.body.sku !== undefined) product.sku = req.body.sku;
    if (req.body.purchasePrice !== undefined)
      product.purchasePrice = Number(req.body.purchasePrice);
    if (req.body.retailPrice !== undefined) {
      product.retailPrice = Number(req.body.retailPrice);
      product.price = Number(req.body.retailPrice);
    }
    if (req.body.wholesalePrice !== undefined)
      product.wholesalePrice = Number(req.body.wholesalePrice);
    if (req.body.quantity !== undefined) {
      product.quantity = Number(req.body.quantity);
    }
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.status !== undefined) product.status = req.body.status;
    if (req.body.expiryDate !== undefined) {
      product.expiryDate = req.body.expiryDate
        ? new Date(req.body.expiryDate)
        : null;
    }

    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
