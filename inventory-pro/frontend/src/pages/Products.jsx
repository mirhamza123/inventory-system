import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Search, Truck } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import InventoryTable from "../components/InventoryTable";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { exportStockReport } from "../utils/exportReports";

const buildStats = (products) => {
  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0,
  );
  const lowStockCount = products.filter(
    (product) => Number(product.quantity || 0) < 5,
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
      accent: "border-l-[#2f8a5a]",
      iconBg: "bg-[#eef2ff] text-[#4052d7]",
      status: "↗ +12% from last month",
      statusColor: "text-[#2e9e5b]",
    },
    {
      label: "Low Stock",
      value: lowStockCount.toString(),
      valueColor: "text-red-600",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      accent: "border-l-[#e53935]",
      iconBg: "bg-[#ffefef] text-[#e53935]",
      status: "Needs attention",
      statusColor: "text-[#d43d3d]",
    },
    {
      label: "Total Units",
      value: totalUnits.toLocaleString(),
      suffix: "Units",
      accent: "border-l-[#4169e1]",
      iconBg: "bg-[#eaf1ff] text-[#4169e1]",
      status: "Units in stock",
      statusColor: "text-[#5f6c7b]",
      icon: Truck,
      iconColor: "text-[#4169e1]",
    },
    {
      label: "Stock Value",
      value: `$${stockValue.toLocaleString()}`,
      icon: Truck,
      iconColor: "text-slate-400",
      accent: "border-l-[#8a5cf6]",
      iconBg: "bg-[#f3e8ff] text-[#8a5cf6]",
      status: "Updated 5 mins ago",
      statusColor: "text-[#6b7280]",
    },
  ];
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    purchasePrice: "",
    retailPrice: "",
    wholesalePrice: "",
    quantity: "",
    category: "",
    expiryDate: "",
  });
  const { logout } = useAuth();

  const stats = useMemo(() => buildStats(products), [products]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    );
    return ["All Categories", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const searchableText = [product.name, product.sku, product.brand]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || searchableText.includes(query);
      const normalizedCategory = String(product.category || "General")
        .trim()
        .toLowerCase();
      const matchesCategory =
        selectedCategory === "All Categories" ||
        normalizedCategory === selectedCategory.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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
        purchasePrice: Number(form.purchasePrice),
        retailPrice: Number(form.retailPrice),
        wholesalePrice: Number(form.wholesalePrice),
        quantity: Number(form.quantity),
        expiryDate: form.expiryDate || null,
      });
      setForm({
        name: "",
        sku: "",
        purchasePrice: "",
        retailPrice: "",
        wholesalePrice: "",
        quantity: "",
        category: "",
        expiryDate: "",
      });
      await fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add product");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f2] font-sans text-slate-900">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Product inventory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage and track your warehouse stock levels in real time.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportStockReport(products)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Export stock
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#1a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253258]"
              >
                <Plus size={15} />
                Add new product
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ">
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
                accent,
                iconBg,
                status,
                statusColor,
              }) => (
                <div
                  key={label}
                  className={`flex h-[120px] flex-col justify-between rounded-xl border border-[#eceee9] bg-white p-4  ${accent} `}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8f9c]">
                      {label}
                    </span>
                    {Icon ? (
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
                      >
                        <Icon size={16} className={iconColor} />
                      </div>
                    ) : (
                      <div className="h-8 w-8" />
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <span
                      className={`text-2xl font-bold leading-none ${valueColor || "text-[#1a2332]"}`}
                    >
                      {value}
                    </span>
                    {tag && (
                      <span
                        className={`pb-1 text-sm font-semibold ${tagColor}`}
                      >
                        {tag}
                      </span>
                    )}
                    {suffix && (
                      <span className="pb-1 text-[14px] text-slate-400">
                        {suffix}
                      </span>
                    )}
                  </div>

                  <div className={`text-[12px] font-medium ${statusColor}`}>
                    {status}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-[#dfe1df] bg-[#f3f4f2] px-3.5 py-3 text-sm text-slate-400 shadow-sm">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products, SKUs, or brands..."
                className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex min-w-[180px] items-center justify-between rounded-lg border border-[#dfe1df] bg-[#f3f4f2] px-3.5 py-3 text-sm text-slate-700 shadow-sm">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full bg-transparent text-[15px] font-medium outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-6">
            <InventoryTable
              initialProducts={filteredProducts}
              onProductsChange={setProducts}
            />
          </div>

          <Modal
            open={showModal}
            title="Add new product"
            onClose={() => setShowModal(false)}
          >
            <form
              onSubmit={async (e) => {
                await handleSubmit(e);
                setShowModal(false);
              }}
              className="space-y-3"
            >
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
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-200 p-3 text-sm"
                type="number"
                placeholder="Purchase Price"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
              />
              <input
                className="w-full rounded border border-slate-200 p-3 text-sm"
                type="number"
                placeholder="Retail Price"
                value={form.retailPrice}
                onChange={(e) =>
                  setForm({ ...form, retailPrice: e.target.value })
                }
              />
              <input
                className="w-full rounded border border-slate-200 p-3 text-sm"
                type="number"
                placeholder="Wholesale Price"
                value={form.wholesalePrice}
                onChange={(e) =>
                  setForm({ ...form, wholesalePrice: e.target.value })
                }
              />
              <input
                className="w-full rounded border border-slate-200 p-3 text-sm"
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-200 p-3 text-sm"
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Save Product
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
