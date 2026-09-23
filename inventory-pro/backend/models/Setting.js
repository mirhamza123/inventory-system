import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
      default: "InventoryPro",
    },
    currency: { type: String, required: true, trim: true, default: "USD" },
    currencySymbol: { type: String, trim: true, default: "$" },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    address: { type: String, trim: true, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Setting", settingSchema);
