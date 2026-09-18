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
  downloadWorkbook(
    [
      {
        name: "Sales",
        rows: transactions
          .filter((transaction) => transaction.type === "stock-out")
          .map((transaction) => ({
            Date: transaction.createdAt,
            Product: transaction.product?.name || transaction.productName,
            Quantity: Number(transaction.quantity || 0),
            SaleType: transaction.saleType || "Retail",
            SellingPrice: Number(transaction.sellingPrice || 0),
            Revenue:
              Number(transaction.sellingPrice || 0) *
              Number(transaction.quantity || 0),
            Profit: Number(transaction.totalProfit || 0),
          })),
      },
    ],
    `sales-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};
