import {
  Bell,
  FileText,
  LayoutGrid,
  LogOut,
  Repeat,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../utils/api";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
  { label: "Products", to: "/products", icon: FileText },
  { label: "Stock In/Out", to: "/stock", icon: Repeat },
  { label: "Alerts", to: "/alerts", icon: Bell },
];

export default function Sidebar({ onLogout }) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        const response = await api.get("/products/alerts");
        const total =
          (response.data?.expired?.length || 0) +
          (response.data?.expiringSoon?.length || 0);
        if (isMounted) {
          setAlertCount(total);
        }
      } catch (error) {
        if (isMounted) {
          setAlertCount(0);
        }
      }
    };

    fetchAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="flex min-h-screen w-56 flex-col bg-[#1a2540] p-5 text-white">
      <div className="mb-4 border-b border-white/10 pb-6">
        <h1 className="text-lg font-bold">InventoryPro</h1>
        <span className="text-xs uppercase tracking-wider text-slate-400">
          Warehouse Admin
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, to, icon: Icon }) => {
          const showAlertBadge = label === "Alerts" && alertCount > 0;

          return (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border-l-2 border-emerald-400 bg-[#2a3654] text-white"
                    : "text-slate-400 hover:bg-white/5"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={16} />
                <span>{label}</span>
              </span>
              {showAlertBadge && (
                <span className="inline-flex min-w-[1.4rem] justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                  {alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? "border-l-2 border-emerald-400 bg-[#2a3654] text-white"
                : "text-slate-400 hover:bg-white/5"
            }`
          }
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={(e) => {
            e.preventDefault();
            onLogout && onLogout();
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
