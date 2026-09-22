import * as XLSX from "xlsx";

const downloadWorkbook = (sheets, fileName) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  XLSX.writeFile(workbook, fileName);
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

export const exportSalesReport = (transactions) => {
  const saleRows = transactions
    .filter((transaction) => transaction.type === "stock-out")
    .map((transaction) => {
      const grossRevenue =
        Number(transaction.sellingPrice || 0) *
        Number(transaction.quantity || 0);
      const discountAmount = Number(transaction.discount || 0);
      const netRevenue = Math.max(grossRevenue - discountAmount, 0);
      const adjustedProfit = Math.max(
        (Number(transaction.totalProfit || 0) || 0) - discountAmount,
        0,
      );

      return {
        Date: transaction.createdAt,
        Product: transaction.product?.name || transaction.productName,
        Quantity: Number(transaction.quantity || 0),
        SaleType: transaction.saleType || "Retail",
        SellingPrice: Number(transaction.sellingPrice || 0),
        "Gross Revenue": grossRevenue,
        "Discount Amount": discountAmount,
        "Net Revenue": netRevenue,
        "Adjusted Profit": adjustedProfit,
        Profit: Number(transaction.totalProfit || 0),
      };
    });

  const totals = saleRows.reduce(
    (accumulator, row) => {
      accumulator.grossRevenue += Number(row["Gross Revenue"] || 0);
      accumulator.totalDiscounts += Number(row["Discount Amount"] || 0);
      accumulator.netRevenue += Number(row["Net Revenue"] || 0);
      accumulator.finalProfit += Number(row["Adjusted Profit"] || 0);
      return accumulator;
    },
    {
      grossRevenue: 0,
      totalDiscounts: 0,
      netRevenue: 0,
      finalProfit: 0,
    },
  );

  const totalRow = {
    Date: "TOTAL",
    Product: "",
    Quantity: "",
    SaleType: "",
    SellingPrice: "",
    "Gross Revenue": totals.grossRevenue,
    "Discount Amount": totals.totalDiscounts,
    "Net Revenue": totals.netRevenue,
    "Adjusted Profit": totals.finalProfit,
    Profit: totals.finalProfit,
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
