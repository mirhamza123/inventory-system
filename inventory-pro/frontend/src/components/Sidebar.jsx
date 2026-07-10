import { NavLink } from "react-router-dom";

export default function Sidebar({ onLogout }) {
  return (
    <aside className="w-56 bg-[#1a2540] text-white flex flex-col min-h-screen p-5">
      <div className="pb-6 mb-4 border-b border-white/10">
        <h1 className="text-lg font-bold">InventoryPro</h1>
        <span className="text-xs uppercase tracking-wider text-slate-400">
          Warehouse Admin
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              isActive
                ? "bg-[#2a3654] text-white"
                : "text-slate-300 hover:bg-white/5"
            }`
          }
        >
          <span className="w-4 text-center">▦</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              isActive
                ? "bg-[#2a3654] text-white"
                : "text-slate-300 hover:bg-white/5"
            }`
          }
        >
          <span className="w-4 text-center">▭</span>
          <span>Products</span>
        </NavLink>

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              isActive
                ? "bg-[#2a3654] text-white"
                : "text-slate-300 hover:bg-white/5"
            }`
          }
        >
          <span className="w-4 text-center">⇄</span>
          <span>Stock In/Out</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              isActive
                ? "bg-[#2a3654] text-white"
                : "text-slate-300 hover:bg-white/5"
            }`
          }
        >
          <span className="w-4 text-center">🔔</span>
          <span>Alerts</span>
        </NavLink>
      </nav>

      <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              isActive
                ? "bg-[#2a3654] text-white"
                : "text-slate-300 hover:bg-white/5"
            }`
          }
        >
          <span className="w-4 text-center">⚙</span>
          <span>Settings</span>
        </NavLink>

        <button
          onClick={(e) => {
            e.preventDefault();
            onLogout && onLogout();
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-white/5"
        >
          <span className="w-4 text-center">⇥</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
