import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    sku: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, trim: true, default: "General" },
    status: {
      type: String,
      trim: true,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
