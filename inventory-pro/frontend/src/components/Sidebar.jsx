import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/stock", label: "Stock" },
  { to: "/alerts", label: "Alerts" },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h2 className="text-2xl font-semibold mb-8">Inventory Pro</h2>
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded px-4 py-2 ${isActive ? "bg-slate-700" : "hover:bg-slate-800"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={onLogout}
        className="mt-8 w-full rounded bg-red-600 px-4 py-2 text-left hover:bg-red-500"
      >
        Logout
      </button>
    </aside>
  );
}
