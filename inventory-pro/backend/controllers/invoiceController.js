import Invoice from "../models/Invoice.js";

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
};

export const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const parsedStart = startDate ? parseDate(startDate) : null;
    const parsedEnd = endDate ? parseDate(endDate) : null;

    if ((startDate && !parsedStart) || (endDate && !parsedEnd)) {
      return res
        .status(400)
        .json({ message: "Dates must use YYYY-MM-DD format" });
    }

    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      return res
        .status(400)
        .json({ message: "Start date must not be after end date" });
    }

    const filter = {};
    if (parsedStart || parsedEnd) {
      filter.createdAt = {};
      if (parsedStart) filter.createdAt.$gte = parsedStart;
      if (parsedEnd) {
        const endExclusive = new Date(parsedEnd);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
        filter.createdAt.$lt = endExclusive;
      }
    }

    const [invoices, summaries] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).lean(),
      Invoice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalRevenue: { $sum: "$netTotal" },
          },
        },
      ]),
    ]);
    const summary = summaries[0] || { totalInvoices: 0, totalRevenue: 0 };

    res.json({
      invoices: invoices.map((invoice) => ({
        ...invoice,
        id: invoice.legacyId || String(invoice._id),
        date: invoice.createdAt,
      })),
      totalInvoices: summary.totalInvoices,
      totalRevenue: summary.totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importLegacyInvoices = async (req, res) => {
  try {
    const { invoices } = req.body;
    if (!Array.isArray(invoices) || invoices.length > 1000) {
      return res
        .status(400)
        .json({ message: "A valid invoice list is required" });
    }

    const operations = [];
    for (const invoice of invoices) {
      const legacyId = String(invoice?.id || "").trim();
      const createdAt = new Date(invoice?.date);
      const quantity = Number(invoice?.quantity);
      const price = Number(invoice?.price || 0);
      const discount = Number(invoice?.discount || 0);
      const discountValue = Number(invoice?.discountValue ?? discount);
      const netTotal = Number(invoice?.netTotal);

      if (
        !legacyId ||
        Number.isNaN(createdAt.getTime()) ||
        !Number.isFinite(quantity) ||
        quantity < 1 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(discount) ||
        discount < 0 ||
        !Number.isFinite(discountValue) ||
        discountValue < 0 ||
        !Number.isFinite(netTotal) ||
        netTotal < 0
      ) {
        return res.status(400).json({ message: "Invoice data is invalid" });
      }

      operations.push({
        updateOne: {
          filter: { legacyId },
          update: {
            $setOnInsert: {
              legacyId,
              customerName: String(invoice.customerName || "Walk-in Customer"),
              productName: String(invoice.productName || "Product"),
              quantity,
              price,
              discount,
              discountType:
                invoice.discountType === "percent" ? "percent" : "fixed",
              discountValue,
              netTotal,
              createdAt,
              updatedAt: createdAt,
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length) {
      await Invoice.bulkWrite(operations, {
        ordered: false,
        timestamps: false,
      });
    }

    res.json({ imported: operations.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
