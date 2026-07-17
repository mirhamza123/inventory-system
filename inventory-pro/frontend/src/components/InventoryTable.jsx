import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import api from "../utils/api";
import EditProductModal from "./EditProductModal";

export default function InventoryTable({ initialProducts }) {
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeProduct = (product) => ({
    id: product.id || product._id || String(product.sku),
    name: product.name || "",
    brand:
      product.brand !== undefined && product.brand !== null
        ? product.brand
        : product.category || "",
    sku: product.sku || "",
    category: product.category || "",
    price: product.price ?? 0,
    quantity: product.quantity ?? 0,
    status:
      product.status || (product.quantity > 0 ? "Available" : "Unavailable"),
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/products");
      const items = Array.isArray(response.data)
        ? response.data.map(normalizeProduct)
        : [];
      setProducts(items);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load inventory. Check your backend connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setActiveProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (updatedProduct) => {
    setError("");

    try {
      const response = await api.put(`/products/${updatedProduct.id}`, {
        name: updatedProduct.name,
        brand: updatedProduct.brand,
        status: updatedProduct.status,
      });

      const rawItem = response.data || updatedProduct;
      const updatedItem = normalizeProduct({
        ...rawItem,
        brand:
          rawItem.brand !== undefined && rawItem.brand !== null
            ? rawItem.brand
            : updatedProduct.brand,
        status:
          rawItem.status !== undefined && rawItem.status !== null
            ? rawItem.status
            : updatedProduct.status,
      });

      setProducts((current) =>
        current.map((item) =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item,
        ),
      );
      setIsModalOpen(false);
      setActiveProduct(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save product changes. Please try again.",
      );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Inventory table
        </h3>
        <span className="text-xs text-slate-500">
          Showing {products.length} products
        </span>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong className="font-semibold">Backend error:</strong> {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">SKU/Code</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" />
                    Loading inventory from backend...
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No products available. Ensure the backend is running and the
                  /api/products endpoint is reachable.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isLowStock = product.quantity < 10;
                return (
                  <tr key={product.id} className="border-t border-slate-100">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                          {product.name?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-sm font-medium text-blue-600">
                      {product.sku}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase text-blue-700">
                        {product.category || "General"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                      ${product.price}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          isLowStock ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isLowStock ? "bg-red-500" : "bg-emerald-500"
                          }`}
                        />
                        {product.quantity} Units
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                      {product.status}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="text-slate-400 transition hover:text-slate-700"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <EditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={activeProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
