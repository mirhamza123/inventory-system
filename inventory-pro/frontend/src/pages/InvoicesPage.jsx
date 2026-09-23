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
  const selectedInvoiceNetTotal = Math.max(
    selectedInvoiceSubtotal - selectedInvoiceDiscount,
    0,
  );

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
    <div className="flex min-h-screen w-full max-w-full overflow-hidden bg-slate-100">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto p-6">
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
                  padding: "32px",
                  boxSizing: "border-box",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{ margin: 0, fontSize: "30px", fontWeight: 700 }}
                    >
                      {localStorage.getItem("storeName") || "InventoryPro"}
                    </h3>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      Invoice Receipt
                    </p>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    <p style={{ margin: 0 }}>Invoice #{selectedInvoice.id}</p>
                    <p style={{ margin: "6px 0 0" }}>
                      Date: {new Date(selectedInvoice.date).toLocaleString()}
                    </p>
                    <p style={{ margin: "6px 0 0" }}>
                      Customer: {selectedInvoice.customerName}
                    </p>
                  </div>
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f3f4f6",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Product
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Qty
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Price
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px 8px" }}>
                        {selectedInvoice.productName}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {selectedInvoice.quantity}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {formatCurrency(selectedInvoice.price, currencySymbol)}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
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
                    marginTop: "24px",
                    marginLeft: "auto",
                    maxWidth: "320px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span>Subtotal</span>
                    <span>
                      {formatCurrency(selectedInvoiceSubtotal, currencySymbol)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span>Discount</span>
                    <span>
                      {formatCurrencySigned(
                        -selectedInvoiceDiscount,
                        currencySymbol,
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "10px",
                      borderTop: "1px solid #e5e7eb",
                      fontWeight: 700,
                      fontSize: "18px",
                    }}
                  >
                    <span>Net Total</span>
                    <span>
                      {formatCurrency(selectedInvoiceNetTotal, currencySymbol)}
                    </span>
                  </div>
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
