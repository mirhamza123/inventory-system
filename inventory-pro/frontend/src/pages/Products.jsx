import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Truck } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import InventoryTable from "../components/InventoryTable";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";

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
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "",
    category: "",
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

      <div className="flex flex-1 flex-col">
        <Topbar
          title="Product inventory"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />

        <main className="p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Product inventory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage and track your warehouse stock levels in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253258]"
            >
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
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-200 p-3 text-sm"
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
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
