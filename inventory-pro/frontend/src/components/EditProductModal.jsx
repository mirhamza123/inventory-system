import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function EditProductModal({ isOpen, onClose, product, onSave }) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    brand: "",
    status: "Available",
  });

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name || "",
        brand: product.brand || "",
        status: product.status || "Available",
      });
    } else {
      setForm({ id: "", name: "", brand: "", status: "Available" });
    }
  }, [product]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({
      id: form.id,
      name: form.name.trim(),
      brand: form.brand.trim(),
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#1a2540] px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Edit Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-200 transition hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Product Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Brand / Subtext
            </label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Stock Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#1a2540] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253258]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
