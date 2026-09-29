import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      unique: true,
      sparse: true,
    },
    legacyId: { type: String, unique: true, sparse: true },
    customerName: { type: String, trim: true, default: "Walk-in Customer" },
    productName: { type: String, trim: true, required: true },
    quantity: { type: Number, min: 1, required: true },
    price: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    discountType: {
      type: String,
      enum: ["fixed", "percent"],
      default: "fixed",
    },
    discountValue: { type: Number, min: 0, default: 0 },
    netTotal: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);
