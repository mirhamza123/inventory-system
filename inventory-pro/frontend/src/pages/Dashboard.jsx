import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, transactionsRes] = await Promise.all([
        api.get("/products"),
        api.get("/stock"),
      ]);
      setProducts(productsRes.data);
      setTransactions(transactionsRes.data);
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar onLogout={logout} />
      <main className="flex-1 p-6">
        <Topbar title="Dashboard" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Items"
            value={products.length}
            accent="text-blue-600"
          />
          <StatCard
            label="Low Stock"
            value={products.filter((p) => p.quantity < 10).length}
            accent="text-orange-500"
          />
          <StatCard
            label="Stock Value"
            value={`$${products.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}`}
            accent="text-green-600"
          />
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Activities</h2>
          <ul className="space-y-2">
            {transactions.slice(0, 5).map((t) => (
              <li
                key={t._id}
                className="rounded border p-3 text-sm text-slate-600"
              >
                {t.type === "stock-in" ? "Stock In" : "Stock Out"}: {t.quantity}{" "}
                units for {t.product?.name || "Product"}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
