import Setting from "../models/Setting.js";

const defaultSettings = {
  storeName: "InventoryPro",
  currency: "USD",
  currencySymbol: "$",
  taxRate: 0,
  address: "",
  logoUrl: "",
};

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  PKR: "Rs",
  INR: "₹",
  AED: "د.إ",
  SAR: "﷼",
  QAR: "ر.ق",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export const getSettings = async (_req, res) => {
  try {
    const settings = await Setting.findOne().sort({ createdAt: 1 });
    res.json(settings || defaultSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { storeName, currency, currencySymbol, taxRate, address, logoUrl } =
      req.body;
    const parsedTaxRate = Number(taxRate);
    const normalizedCurrency = (currency || "USD").trim().toUpperCase();
    const resolvedSymbol =
      (currencySymbol || currencySymbols[normalizedCurrency] || "$").trim() ||
      "$";

    if (
      !storeName?.trim() ||
      !normalizedCurrency ||
      Number.isNaN(parsedTaxRate)
    ) {
      return res
        .status(400)
        .json({ message: "Store name, currency, and tax rate are required" });
    }

    if (parsedTaxRate < 0 || parsedTaxRate > 100) {
      return res
        .status(400)
        .json({ message: "Tax rate must be between 0 and 100" });
    }

    const settings = await Setting.findOneAndUpdate(
      {},
      {
        storeName: storeName.trim(),
        currency: normalizedCurrency,
        currencySymbol: resolvedSymbol,
        taxRate: parsedTaxRate,
        address: address?.trim() || "",
        logoUrl: logoUrl?.trim() || "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
