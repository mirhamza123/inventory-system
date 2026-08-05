import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["stock-in", "stock-out"], required: true },
    saleType: { type: String, enum: ["Retail", "Wholesale"], trim: true },
    sellingPrice: { type: Number, min: 0, default: 0 },
    unitProfit: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, trim: true, default: "Manual entry" },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Transaction", transactionSchema);
