import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Truck } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProductRow from "../components/ProductRow";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const buildStats = (products) => {
  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0,
  );
  const lowStockCount = products.filter(
    (product) => (product.quantity || 0) < 10,
  ).length;
  const stockValue = products.reduce(
    (sum, product) =>
      sum + Number(product.price || 0) * Number(product.quantity || 0),
    0,
  );

  return [
    {
      label: "Total SKU",
      value: products.length.toLocaleString(),
      tag: "+12%",
      tagColor: "text-emerald-600",
    },
    {
      label: "Low Stock",
      value: lowStockCount.toString(),
      valueColor: "text-red-600",
      icon: AlertTriangle,
      iconColor: "text-red-500",
    },
    {
      label: "Total Units",
      value: totalUnits.toLocaleString(),
      suffix: "Units",
    },
    {
      label: "Stock Value",
      value: `$${stockValue.toLocaleString()}`,
      icon: Truck,
      iconColor: "text-slate-400",
    },
  ];
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "",
    category: "",
  });
  const { logout } = useAuth();

  const stats = useMemo(() => buildStats(products), [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/products", {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      });
      setForm({ name: "", sku: "", price: "", quantity: "", category: "" });
      await fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add product");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f2] font-sans text-slate-900">
      <Sidebar onLogout={logout} />

      <div className="flex-1 flex flex-col">
        <Topbar title="Product inventory" />

        <main className="p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Product inventory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage and track your warehouse stock levels in real time.
              </p>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#1a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253258]">
              <Plus size={15} />
              Add new product
            </button>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(
              ({
                label,
                value,
                valueColor,
                tag,
                tagColor,
                suffix,
                icon: Icon,
                iconColor,
              }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {label}
                    </span>
                    {Icon && <Icon size={16} className={iconColor} />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${valueColor || ""}`}>
                      {value}
                    </span>
                    {tag && (
                      <span className={`text-xs font-semibold ${tagColor}`}>
                        {tag}
                      </span>
                    )}
                    {suffix && (
                      <span className="text-xs text-slate-400">{suffix}</span>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Inventory table
                </h3>
                <span className="text-xs text-slate-500">
                  Showing {products.length} products
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">SKU/Code</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Quantity</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-6 text-center text-sm text-slate-500"
                        >
                          Loading products...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-6 text-center text-sm text-slate-500"
                        >
                          No products found yet.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <ProductRow
                          key={product._id || product.sku}
                          product={product}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Add new product</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  className="w-full rounded border border-slate-200 p-3 text-sm"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="w-full rounded border border-slate-200 p-3 text-sm"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                <input
                  className="w-full rounded border border-slate-200 p-3 text-sm"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
                <input
                  className="w-full rounded border border-slate-200 p-3 text-sm"
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  className="w-full rounded border border-slate-200 p-3 text-sm"
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
                <button className="w-full rounded bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Save Product
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
