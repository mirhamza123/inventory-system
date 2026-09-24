import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { exportSalesReport } from "../utils/exportReports";

const INVOICE_HISTORY_KEY = "invoiceHistory";

const getInvoiceHistory = () => {
  try {
    const stored = localStorage.getItem(INVOICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const formatCurrency = (value, symbol = "$") => {
  const safeSymbol = String(symbol || "$").trim() || "$";
  return `${safeSymbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function StockInOut() {
  const [currencySymbol, setCurrencySymbol] = useState(
    () => localStorage.getItem("currencySymbol") || "$",
  );
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [form, setForm] = useState({
    productId: "",
    type: "stock-in",
    saleType: "Retail",
    quantity: "",
    reason: "",
    discount: "",
    discountType: "fixed",
    customerName: "",
  });
  const { logout } = useAuth();

  const selectedProduct =
    products.find((product) => product._id === form.productId) || null;
  const unitPrice =
    form.type === "stock-out"
      ? form.saleType === "Wholesale"
        ? Number(selectedProduct?.wholesalePrice ?? selectedProduct?.price ?? 0)
        : Number(selectedProduct?.retailPrice ?? selectedProduct?.price ?? 0)
      : 0;
  const quantity = Number(form.quantity || 0);
  const subtotal = unitPrice * quantity;
  const rawDiscountValue = Number(form.discount || 0);
  const discountAmount =
    form.type === "stock-out"
      ? form.discountType === "percent"
        ? (Math.min(Math.max(rawDiscountValue, 0), 100) / 100) * subtotal
        : Math.max(0, rawDiscountValue)
      : 0;
  const finalAmount = Math.max(subtotal - discountAmount, 0);

  const fetchData = async () => {
    const [productsRes, transactionsRes] = await Promise.all([
      api.get("/products"),
      api.get("/stock"),
    ]);
    setProducts(productsRes.data);
    setTransactions(transactionsRes.data);
  };

  useEffect(() => {
    const syncCurrency = () => {
      setCurrencySymbol(localStorage.getItem("currencySymbol") || "$");
    };

    syncCurrency();
    window.addEventListener("storage", syncCurrency);

    return () => {
      window.removeEventListener("storage", syncCurrency);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.type === "stock-out") {
      const requestedQty = Number(form.quantity || 0);
      if (!selectedProduct) {
        alert("Please select a product first.");
        return;
      }

      if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
        alert("Please enter a valid quantity for the stock out.");
        return;
      }

      if (requestedQty > Number(selectedProduct.quantity || 0)) {
        alert(
          `Only ${selectedProduct.quantity} unit(s) available for ${selectedProduct.name}.`,
        );
        return;
      }
    }

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      saleType: form.type === "stock-out" ? form.saleType : undefined,
      discountType:
        form.type === "stock-out" ? form.discountType || "fixed" : "fixed",
      discountValue: form.type === "stock-out" ? Number(form.discount || 0) : 0,
      discount: form.type === "stock-out" ? Number(form.discount || 0) : 0,
      reason:
        form.reason ||
        (form.type === "stock-out" ? "Stock out" : "Manual entry"),
      customerName:
        form.type === "stock-out"
          ? form.customerName || "Walk-in Customer"
          : "",
    };

    try {
      const response = await api.post("/stock", payload);

      if (form.type === "stock-out") {
        const invoiceEntry = {
          id: response?.data?._id || `INV-${Date.now()}`,
          customerName: form.customerName || "Walk-in Customer",
          productName:
            selectedProduct?.name || response?.data?.productName || "Product",
          quantity: Number(form.quantity || 0),
          price: Number(response?.data?.sellingPrice ?? unitPrice ?? 0),
          discount: Number(response?.data?.discount ?? form.discount ?? 0),
          discountType:
            response?.data?.discountType || form.discountType || "fixed",
          discountValue: Number(
            response?.data?.discountValue ?? form.discount ?? 0,
          ),
          netTotal: Number(response?.data?.finalAmount ?? finalAmount ?? 0),
          date: response?.data?.createdAt || new Date().toISOString(),
          type: form.type,
          saleType: form.saleType,
          reason: form.reason || "Stock out",
        };

        localStorage.setItem(
          INVOICE_HISTORY_KEY,
          JSON.stringify([invoiceEntry, ...getInvoiceHistory()].slice(0, 50)),
        );
      }

      setForm({
        productId: "",
        type: "stock-in",
        saleType: "Retail",
        quantity: "",
        reason: "",
        discount: "",
        discountType: "fixed",
        customerName: "",
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save transaction.");
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-hidden bg-slate-100">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="flex items-center justify-between gap-4">
          <Topbar title="Stock Movement" />
          <div className="mr-6 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span>Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span>End</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                exportSalesReport(transactions, startDate, endDate)
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export sales
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Stock Form</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                className="w-full rounded border p-3"
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded border p-3"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="stock-in">Stock In</option>
                <option value="stock-out">Stock Out</option>
              </select>
              {form.type === "stock-out" && (
                <>
                  <input
                    className="w-full rounded border p-3"
                    placeholder="Customer Name"
                    value={form.customerName}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                  />

                  <select
                    className="w-full rounded border p-3"
                    value={form.saleType}
                    onChange={(e) =>
                      setForm({ ...form, saleType: e.target.value })
                    }
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>

                  <div className="flex gap-2">
                    <select
                      className="w-32 rounded border p-3"
                      value={form.discountType}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discountType: e.target.value,
                        })
                      }
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percent">Percent</option>
                    </select>
                    <input
                      className="w-full rounded border p-3"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={
                        form.discountType === "percent"
                          ? "Discount %"
                          : `Discount Amount (${currencySymbol})`
                      }
                      value={form.discount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discount: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
              <input
                className="w-full rounded border p-3"
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <input
                className="w-full rounded border p-3"
                placeholder="Reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />

              {form.type === "stock-out" && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between py-1">
                    <span>Subtotal</span>
                    <span>
                      {currencySymbol}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-red-600">
                    <span>
                      Discount Applied
                      {form.discountType === "percent" &&
                        ` (${Number(form.discount || 0).toFixed(2)}%)`}
                    </span>
                    <span>
                      - {currencySymbol}
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                    <span>Net Total / Final Price</span>
                    <span>
                      {currencySymbol}
                      {finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button className="w-full rounded bg-slate-900 px-4 py-3 text-white">
                Save Transaction
              </button>
            </form>
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-y-auto rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Recent Logs</h2>
            <div className="space-y-2 pr-1">
              {transactions.map((entry) => (
                <div
                  key={entry._id}
                  className="rounded border p-3 text-sm text-slate-600"
                >
                  {entry.type === "stock-in" ? "Stock In" : "Stock Out"} •{" "}
                  {entry.quantity} units • {entry.reason} •{" "}
                  {entry.product?.name || "Product"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
