import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ShieldAlert } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusBadgeClasses = (status) => {
  if (status === "EXPIRED") {
    return "bg-red-100 text-red-700 border border-red-200";
  }

  return "bg-amber-100 text-amber-700 border border-amber-200";
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState({
    expired: [],
    expiringSoon: [],
    all: [],
  });
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products/alerts");
      setAlerts(response.data || { expired: [], expiringSoon: [], all: [] });
    } catch (error) {
      console.error("Failed to load alerts", error);
      setAlerts({ expired: [], expiringSoon: [], all: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        title: "Expired Products",
        value: alerts.expired?.length || 0,
        theme: "red",
        icon: ShieldAlert,
      },
      {
        title: "Expiring Soon",
        value: alerts.expiringSoon?.length || 0,
        theme: "amber",
        icon: CalendarClock,
      },
    ],
    [alerts],
  );

  const notificationRows = useMemo(
    () => [
      ...(alerts.expired || []).map((product) => ({
        ...product,
        status: "EXPIRED",
      })),
      ...(alerts.expiringSoon || []).map((product) => ({
        ...product,
        status: "EXPIRING SOON",
      })),
    ],
    [alerts],
  );

  return (
    <div className="flex min-h-screen bg-[#f3f4f2] font-sans text-slate-900">
      <Sidebar onLogout={logout} />

      <div className="flex flex-1 flex-col">
        <Topbar title="Expiry alerts" />

        <main className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Expiry alerts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor products that are expired or due to expire within the next
              30 days.
            </p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {summaryCards.map(({ title, value, theme, icon: Icon }) => (
              <div
                key={title}
                className={`rounded-2xl border p-5 ${
                  theme === "red"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${
                      theme === "red" ? "text-red-700" : "text-amber-700"
                    }`}
                  >
                    {title}
                  </span>
                  <Icon
                    size={18}
                    className={
                      theme === "red" ? "text-red-600" : "text-amber-600"
                    }
                  />
                </div>
                <div
                  className={`text-3xl font-bold ${
                    theme === "red" ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Alert notifications
              </h3>
              <span className="text-xs text-slate-500">
                {notificationRows.length} action items
              </span>
            </div>

            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                Loading alerts...
              </div>
            ) : notificationRows.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No active expiry alerts right now.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {notificationRows.map((product) => (
                  <div
                    key={`${product._id}-${product.status}`}
                    className="px-5 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-slate-800">
                            {product.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({product.sku})
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Expiry Date: {formatDate(product.expiryDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClasses(
                            product.status,
                          )}`}
                        >
                          {product.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {product.status === "EXPIRED"
                        ? `Product ${product.name} (SKU: ${product.sku}) expired on ${formatDate(product.expiryDate)}. Please remove from active stock.`
                        : `Product ${product.name} (SKU: ${product.sku}) will expire on ${formatDate(product.expiryDate)}. Please review and use or discount before expiry.`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
