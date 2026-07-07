import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function StockInOut() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    productId: "",
    type: "stock-in",
    quantity: "",
    reason: "",
  });
  const { logout } = useAuth();

  const fetchData = async () => {
    const [productsRes, transactionsRes] = await Promise.all([
      api.get("/products"),
      api.get("/stock"),
    ]);
    setProducts(productsRes.data);
    setTransactions(transactionsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/stock", { ...form, quantity: Number(form.quantity) });
    setForm({ productId: "", type: "stock-in", quantity: "", reason: "" });
    fetchData();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar onLogout={logout} />
      <main className="flex-1 p-6">
        <Topbar title="Stock Movement" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl bg-white p-6 shadow-sm">
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
              <button className="w-full rounded bg-slate-900 px-4 py-3 text-white">
                Save Transaction
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Recent Logs</h2>
            <div className="space-y-2">
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
