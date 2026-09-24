import { useEffect, useMemo, useState } from "react";
import html2pdf from "html2pdf.js";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(
    () => localStorage.getItem("currencySymbol") || "$",
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
    setInvoices(getInvoiceHistory());

    const syncCurrency = () => {
      setCurrencySymbol(localStorage.getItem("currencySymbol") || "$");
    };

    syncCurrency();
    window.addEventListener("storage", syncCurrency);

    return () => {
      window.removeEventListener("storage", syncCurrency);
    };
  }, []);

  const totalRevenue = useMemo(
    () =>
      invoices.reduce((sum, invoice) => sum + Number(invoice.netTotal || 0), 0),
    [invoices],
  );

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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Invoices</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {invoices.length}
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
          {invoices.length === 0 ? (
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
                        Mir Inventory Pro
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
