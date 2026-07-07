import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["stock-in", "stock-out"], required: true },
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
