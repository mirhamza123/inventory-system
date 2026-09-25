import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Transaction from "../models/Transaction.js";

const normalizeNumber = (value) => Number(value ?? 0) || 0;

export const getSuppliers = async (_req, res) => {
  try {
    const suppliers = await Supplier.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, companyName, phone, address } = req.body;

    if (!name || !companyName) {
      return res
        .status(400)
        .json({ message: "Supplier name and company name are required" });
    }

    const supplier = await Supplier.create({
      name,
      companyName,
      phone: phone || "",
      address: address || "",
      totalPurchased: 0,
      totalPaid: 0,
      totalPayable: 0,
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recordPurchase = async (req, res) => {
  try {
    const { supplierId, productId, quantity, unitCost, amountPaidNow } =
      req.body;

    if (!supplierId || !productId) {
      return res
        .status(400)
        .json({ message: "Supplier and product are required" });
    }

    const normalizedQuantity = Number(quantity ?? 0);
    const normalizedUnitCost = Number(unitCost ?? 0);
    const normalizedAmountPaid = Number(amountPaidNow ?? 0);

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    if (!Number.isFinite(normalizedUnitCost) || normalizedUnitCost < 0) {
      return res.status(400).json({ message: "Valid unit cost is required" });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const totalAmount = normalizedQuantity * normalizedUnitCost;
    const payableAmount = Math.max(totalAmount - normalizedAmountPaid, 0);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.supplier = String(supplier._id);
    await product.save();

    const transaction = await Transaction.create({
      type: "stock-in",
      product: product._id,
      productName: product.name,
      quantity: normalizedQuantity,
      purchasePrice: normalizedUnitCost,
      supplier: supplier._id,
      supplierName: supplier.name,
      amountPaidNow: normalizedAmountPaid,
      totalAmount,
      payableAmount,
      reason: `Purchase from ${supplier.companyName}`,
    });

    supplier.totalPurchased =
      normalizeNumber(supplier.totalPurchased) + totalAmount;
    supplier.totalPaid =
      normalizeNumber(supplier.totalPaid) + normalizedAmountPaid;
    supplier.totalPayable = Math.max(
      supplier.totalPurchased - supplier.totalPaid,
      0,
    );
    await supplier.save();

    res.status(201).json({
      transaction,
      supplier,
      totalAmount,
      payableAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const { name, companyName, phone, address } = req.body;
    if (name !== undefined) supplier.name = name;
    if (companyName !== undefined) supplier.companyName = companyName;
    if (phone !== undefined) supplier.phone = phone || "";
    if (address !== undefined) supplier.address = address || "";

    await supplier.save();
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({ message: "Supplier removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
