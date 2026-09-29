import { useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const INVOICE_HISTORY_KEY = "invoiceHistory";

const formatCurrency = (value, symbol = "$") => {
  const safeSymbol = String(symbol || "$").trim() || "$";
  return `${safeSymbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCurrencySigned = (value, symbol = "$") => {
  const safeSymbol = String(symbol || "$").trim() || "$";
  const numericValue = Number(value || 0);
  const absolute = Math.abs(numericValue);
  const formatted = absolute.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return numericValue < 0
    ? `-${safeSymbol}${formatted}`
    : `${safeSymbol}${formatted}`;
};

const getInvoiceHistory = () => {
  try {
    const stored = localStorage.getItem(INVOICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getQuickFilterRange = (filter) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return {
      startDate: toDateInputValue(today),
      endDate: toDateInputValue(today),
    };
  }

  if (filter === "thisWeek") {
    const weekStart = new Date(today);
    const daysSinceMonday = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - daysSinceMonday);
    return {
      startDate: toDateInputValue(weekStart),
      endDate: toDateInputValue(today),
    };
  }

  if (filter === "thisMonth") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: toDateInputValue(monthStart),
      endDate: toDateInputValue(today),
    };
  }

  return { startDate: "", endDate: "" };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("allTime");
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceError, setInvoiceError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(
    () => localStorage.getItem("currencySymbol") || "$",
  );
  const [storeName, setStoreName] = useState(
    () => localStorage.getItem("storeName") || "InventoryPro",
  );
  const { logout } = useAuth();

  const selectedInvoiceSubtotal = selectedInvoice
    ? Number(selectedInvoice.price || 0) * Number(selectedInvoice.quantity || 0)
    : 0;
  const selectedInvoiceDiscount = Number(selectedInvoice?.discount || 0);
  const selectedInvoiceDiscountValue = Number(
    selectedInvoice?.discountValue ?? selectedInvoice?.discount ?? 0,
  );
  const selectedInvoiceDiscountType = selectedInvoice?.discountType || "fixed";
  const selectedInvoiceNetTotal = Math.max(
    selectedInvoiceSubtotal - selectedInvoiceDiscount,
    0,
  );
  const selectedInvoiceDiscountLabel =
    selectedInvoiceDiscountType === "percent"
      ? `Discount (${selectedInvoiceDiscountValue}%): ${formatCurrencySigned(
          -selectedInvoiceDiscount,
          currencySymbol,
        )}`
      : `Discount: ${formatCurrencySigned(
          -selectedInvoiceDiscount,
          currencySymbol,
        )}`;

  useEffect(() => {
    const syncCurrency = () => {
      setCurrencySymbol(localStorage.getItem("currencySymbol") || "$");
    };
    const syncStoreName = (event) => {
      setStoreName(
        event?.detail?.storeName ||
          localStorage.getItem("storeName") ||
          "InventoryPro",
      );
    };

    syncCurrency();
    syncStoreName();
    window.addEventListener("storage", syncCurrency);
    window.addEventListener("storage", syncStoreName);
    window.addEventListener("store-name-updated", syncStoreName);

    api
      .get("/settings")
      .then((response) => {
        const currentStoreName = response.data?.storeName || "InventoryPro";
        localStorage.setItem("storeName", currentStoreName);
        setStoreName(currentStoreName);
      })
      .catch((error) => {
        console.error("Failed to load store name for invoice", error);
      });

    return () => {
      window.removeEventListener("storage", syncCurrency);
      window.removeEventListener("storage", syncStoreName);
      window.removeEventListener("store-name-updated", syncStoreName);
    };
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    const selectedDates =
      quickFilter === "custom"
        ? { startDate, endDate }
        : getQuickFilterRange(quickFilter);
    const params = {};
    if (selectedDates.startDate) params.startDate = selectedDates.startDate;
    if (selectedDates.endDate) params.endDate = selectedDates.endDate;

    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      setInvoiceError("");

      try {
        const legacyInvoices = getInvoiceHistory();
        if (legacyInvoices.length) {
          await api.post("/invoices/import", { invoices: legacyInvoices });
          localStorage.removeItem(INVOICE_HISTORY_KEY);
        }

        const response = await api.get("/invoices", { params });
        if (!isCurrentRequest) return;

        const data = response.data || {};
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setTotalInvoices(Number(data.totalInvoices || 0));
        setTotalRevenue(Number(data.totalRevenue || 0));
      } catch (error) {
        if (!isCurrentRequest) return;
        setInvoices([]);
        setTotalInvoices(0);
        setTotalRevenue(0);
        setInvoiceError(
          error.response?.data?.message || "Unable to load invoices.",
        );
      } finally {
        if (isCurrentRequest) setLoadingInvoices(false);
      }
    };

    fetchInvoices();
    return () => {
      isCurrentRequest = false;
    };
  }, [startDate, endDate, quickFilter]);

  const displayedDateRange =
    quickFilter === "custom"
      ? { startDate, endDate }
      : getQuickFilterRange(quickFilter);

  const exportSingleInvoice = (invoice) => {
    const printable = document.getElementById("invoice-preview");
    if (!printable) return;

    html2pdf()
      .set({
        margin: 0.5,
        filename: `invoice-${String(invoice.id || "bill")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .from(printable)
      .save();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto p-6">
        <Topbar title="Bill History" />

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-end">
          <label className="flex min-w-[150px] flex-1 flex-col text-sm font-medium text-slate-600">
            <span className="mb-1 font-semibold">Start Date</span>
            <input
              type="date"
              value={displayedDateRange.startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setQuickFilter("custom");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            />
          </label>
          <label className="flex min-w-[150px] flex-1 flex-col text-sm font-medium text-slate-600">
            <span className="mb-1 font-semibold">End Date</span>
            <input
              type="date"
              value={displayedDateRange.endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setQuickFilter("custom");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            />
          </label>
          <label className="flex min-w-[170px] flex-1 flex-col text-sm font-medium text-slate-600">
            <span className="mb-1 font-semibold">Quick Filter</span>
            <select
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            >
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="allTime">All Time</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setQuickFilter("allTime");
            }}
            className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>

        {invoiceError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {invoiceError}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Invoices</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {totalInvoices}
            </h3>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Revenue</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(totalRevenue, currencySymbol)}
            </h3>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Latest</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              {invoices[0]?.customerName || "No bills yet"}
            </h3>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loadingInvoices ? (
            <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
              No saved invoices yet. Stock out transactions will appear here
              after saving.
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                      Invoice #{invoice.id}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {invoice.customerName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {invoice.productName} • {invoice.quantity} units •{" "}
                      {new Date(invoice.date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        Net total
                      </div>
                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {formatCurrency(invoice.netTotal, currencySymbol)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(invoice)}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Download / Print
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900">
                  Invoice Preview
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div
                id="invoice-preview"
                style={{
                  width: "100%",
                  maxWidth: "760px",
                  margin: "0 auto",
                  background: "#ffffff",
                  color: "#111827",
                  fontFamily: "Arial, sans-serif",
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    background: "#1e293b",
                    color: "#ffffff",
                    borderTop: "4px solid #2563eb",
                    padding: "22px 28px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "30px",
                          fontWeight: 700,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {storeName}
                      </div>
                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "13px",
                          color: "#cbd5e1",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Official Sales Receipt
                      </div>
                    </div>

                    <span
                      style={{
                        background: "#22c55e",
                        color: "#ffffff",
                        padding: "7px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Paid
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "22px 28px 8px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "18px",
                      marginBottom: "22px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "6px",
                        }}
                      >
                        Customer
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 700 }}>
                        {selectedInvoice.customerName}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "6px",
                        }}
                      >
                        Invoice Details
                      </div>
                      <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
                        <div>
                          <strong>Invoice:</strong> #{selectedInvoice.id}
                        </div>
                        <div>
                          <strong>Date:</strong>{" "}
                          {new Date(selectedInvoice.date).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Time:</strong>{" "}
                          {new Date(selectedInvoice.date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px 14px",
                            borderBottom: "1px solid #e2e8f0",
                            color: "#334155",
                            fontWeight: 700,
                          }}
                        >
                          Product
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "12px 14px",
                            borderBottom: "1px solid #e2e8f0",
                            color: "#334155",
                            fontWeight: 700,
                            width: "90px",
                          }}
                        >
                          Qty
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "12px 14px",
                            borderBottom: "1px solid #e2e8f0",
                            color: "#334155",
                            fontWeight: 700,
                            width: "120px",
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "12px 14px",
                            borderBottom: "1px solid #e2e8f0",
                            color: "#334155",
                            fontWeight: 700,
                            width: "130px",
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: "12px 14px",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {selectedInvoice.productName}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {selectedInvoice.quantity}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "right",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {formatCurrency(
                            selectedInvoice.price,
                            currencySymbol,
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "right",
                            borderBottom: "1px solid #f1f5f9",
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(
                            selectedInvoiceSubtotal,
                            currencySymbol,
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div
                    style={{
                      marginTop: "22px",
                      marginLeft: "auto",
                      maxWidth: "340px",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "14px",
                        color: "#334155",
                      }}
                    >
                      <span>Subtotal</span>
                      <span>
                        {formatCurrency(
                          selectedInvoiceSubtotal,
                          currencySymbol,
                        )}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "14px",
                        color: "#dc2626",
                      }}
                    >
                      <span>{selectedInvoiceDiscountLabel}</span>
                      <span></span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "12px",
                        marginTop: "12px",
                        borderTop: "2px solid #e2e8f0",
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "#0f172a",
                      }}
                    >
                      <span>Net Total</span>
                      <span>
                        {formatCurrency(
                          selectedInvoiceNetTotal,
                          currencySymbol,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "22px 20px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "13px",
                  }}
                >
                  Thank you for your business! For queries, contact support.
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => exportSingleInvoice(selectedInvoice)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Download / Print
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
