import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProductRow from "../components/ProductRow";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "",
    category: "",
  });
  const { logout } = useAuth();

  const fetchProducts = async () => {
    const res = await api.get("/products");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/products", {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
    });
    setForm({ name: "", sku: "", price: "", quantity: "", category: "" });
    fetchProducts();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar onLogout={logout} />
      <main className="flex-1 p-6">
        <Topbar title="Products" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Inventory Table</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <ProductRow key={product._id} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Add Product</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full rounded border p-3"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full rounded border p-3"
                placeholder="SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              <input
                className="w-full rounded border p-3"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="w-full rounded border p-3"
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <input
                className="w-full rounded border p-3"
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <button className="w-full rounded bg-slate-900 px-4 py-3 text-white">
                Save Product
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
