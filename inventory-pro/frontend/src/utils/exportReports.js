import * as XLSX from "xlsx";

const toNumber = (value) => Number(value ?? 0);

const calculateGrossRevenue = (sellingPrice, quantity) =>
  toNumber(sellingPrice) * toNumber(quantity);

const calculateDiscountAmount = (discount, grossRevenue) => {
  const value = toNumber(discount);
  return Math.max(0, Math.min(value, grossRevenue));
};

const calculateNetRevenue = (grossRevenue, discountAmount) =>
  Math.max(grossRevenue - discountAmount, 0);

const calculateBaseProfit = (sellingPrice, purchasePrice, quantity) =>
  (toNumber(sellingPrice) - toNumber(purchasePrice)) * toNumber(quantity);

const calculateAdjustedProfit = (baseProfit, discountAmount) =>
  Math.max(baseProfit - discountAmount, 0);

const downloadWorkbook = (sheets, fileName) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  XLSX.writeFile(workbook, fileName);
};

const isWithinDateRange = (dateValue, startDate, endDate) => {
  if (!startDate && !endDate) {
    return true;
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const normalizedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const normalizedEnd = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

  if (normalizedStart && parsedDate < normalizedStart) {
    return false;
  }

  if (normalizedEnd && parsedDate > normalizedEnd) {
    return false;
  }

  return true;
};

export const exportStockReport = (products) => {
  downloadWorkbook(
    [
      {
        name: "Stock",
        rows: products.map((product) => ({
          Product: product.name,
          SKU: product.sku,
          Category: product.category || "General",
          Quantity: Number(product.quantity || 0),
          Price: Number(product.price || product.retailPrice || 0),
          StockValue:
            Number(product.quantity || 0) *
            Number(product.price || product.retailPrice || 0),
        })),
      },
    ],
    `stock-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};

export const exportSalesReport = (
  transactions,
  startDate = "",
  endDate = "",
) => {
  const saleRows = transactions
    .filter(
      (transaction) =>
        transaction.type === "stock-out" &&
        isWithinDateRange(transaction.createdAt, startDate, endDate),
    )
    .map((transaction) => {
      const sellingPrice = toNumber(
        transaction.sellingPrice ??
          transaction.product?.retailPrice ??
          transaction.product?.price ??
          0,
      );
      const quantity = toNumber(transaction.quantity);
      const purchasePrice = toNumber(
        transaction.purchasePrice ?? transaction.product?.purchasePrice ?? 0,
      );
      const grossRevenue = calculateGrossRevenue(sellingPrice, quantity);
      const discountAmount = calculateDiscountAmount(
        transaction.discount,
        grossRevenue,
      );
      const netRevenue = calculateNetRevenue(grossRevenue, discountAmount);
      const baseProfit = calculateBaseProfit(
        sellingPrice,
        purchasePrice,
        quantity,
      );
      const adjustedProfit = calculateAdjustedProfit(
        baseProfit,
        discountAmount,
      );

      return {
        Date: transaction.createdAt,
        Product: transaction.product?.name || transaction.productName,
        Quantity: quantity,
        "Sale Type": transaction.saleType || "Retail",
        "Selling Price": sellingPrice,
        "Gross Revenue": grossRevenue,
        "Discount Amount": discountAmount,
        "Net Revenue": netRevenue,
        "Base Profit": baseProfit,
        "Adjusted Profit": adjustedProfit,
      };
    });

  const totals = saleRows.reduce(
    (accumulator, row) => {
      accumulator.grossRevenue += toNumber(row["Gross Revenue"] || 0);
      accumulator.totalDiscounts += toNumber(row["Discount Amount"] || 0);
      accumulator.netRevenue += toNumber(row["Net Revenue"] || 0);
      accumulator.baseProfit += toNumber(row["Base Profit"] || 0);
      accumulator.adjustedProfit += toNumber(row["Adjusted Profit"] || 0);
      return accumulator;
    },
    {
      grossRevenue: 0,
      totalDiscounts: 0,
      netRevenue: 0,
      baseProfit: 0,
      adjustedProfit: 0,
    },
  );

  const totalRow = {
    Date: "TOTAL",
    Product: "",
    Quantity: "",
    "Sale Type": "",
    "Selling Price": "",
    "Gross Revenue": totals.grossRevenue,
    "Discount Amount": totals.totalDiscounts,
    "Net Revenue": totals.netRevenue,
    "Base Profit": totals.baseProfit,
    "Adjusted Profit": totals.adjustedProfit,
  };

  downloadWorkbook(
    [
      {
        name: "Sales",
        rows: [...saleRows, totalRow],
      },
    ],
    `sales-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};
