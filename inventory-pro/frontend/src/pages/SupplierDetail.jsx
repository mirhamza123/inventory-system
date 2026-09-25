import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const formatCurrency = (value) => {
  const currencySymbol = localStorage.getItem("currencySymbol") || "$";
  return `${currencySymbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const matchesSupplier = (product, supplierId) => {
  if (!supplierId) return false;

  const candidateValues = [
    product?.supplier,
    product?.supplierId,
    product?.supplier?._id,
    product?.supplier?.id,
    product?.supplierName,
  ];

  return candidateValues.some((value) => {
    if (!value) return false;
    return (
      String(value) === String(supplierId) ||
      String(value).toLowerCase() === String(supplierId).toLowerCase()
    );
  });
};

export default function SupplierDetail() {
  const { supplierId } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [purchaseTransactions, setPurchaseTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supplierResponse, productsResponse, stockResponse] =
          await Promise.all([
            api.get(`/suppliers/${supplierId}`),
            api.get("/products"),
            api.get("/stock"),
          ]);
        setSupplier(supplierResponse.data || null);
        setProducts(
          Array.isArray(productsResponse.data) ? productsResponse.data : [],
        );
        setPurchaseTransactions(
          Array.isArray(stockResponse.data) ? stockResponse.data : [],
        );
      } catch (error) {
        console.error("Failed to load supplier detail", error);
        setSupplier(null);
        setProducts([]);
        setPurchaseTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      loadData();
    }
  }, [supplierId]);

  const purchaseQuantityByProduct = useMemo(() => {
    const totals = {};

    purchaseTransactions.forEach((transaction) => {
      const matchesSupplierId =
        String(transaction?.supplier || "") === String(supplierId) ||
        String(transaction?.supplier?._id || "") === String(supplierId);
      const isPurchaseRecord = transaction?.type === "stock-in";
      const productId = transaction?.product?._id || transaction?.product || "";

      if (!matchesSupplierId || !isPurchaseRecord || !productId) {
        return;
      }

      const normalizedProductId = String(productId);
      totals[normalizedProductId] =
        (Number(totals[normalizedProductId]) || 0) +
        Number(transaction.quantity || 0);
    });

    return totals;
  }, [purchaseTransactions, supplierId]);

  const supplierProducts = useMemo(
    () => products.filter((product) => matchesSupplier(product, supplierId)),
    [products, supplierId],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f2] font-sans text-slate-900">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="p-8">
          <div className="mb-6">
            <Link
              to="/suppliers"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={15} />
              Back to suppliers
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading supplier detail...
            </div>
          ) : !supplier ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              Supplier not found.
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Supplier profile
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {supplier.companyName}
                    </h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <UserRound size={14} />
                      Supplier Name
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {supplier.name}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Phone size={14} />
                      Phone
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {supplier.phone || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Mail size={14} />
                      Email
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {supplier.email || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 xl:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <MapPin size={14} />
                      Address
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {supplier.address || "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Products from this supplier
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {supplierProducts.length} item
                    {supplierProducts.length === 1 ? "" : "s"}
                  </span>
                </div>

                {supplierProducts.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No products are currently linked to this supplier.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          <th className="px-6 py-3">Product Name</th>
                          <th className="px-6 py-3">SKU</th>
                          <th className="px-6 py-3">Purchased Quantity</th>
                          <th className="px-6 py-3">Purchase Price</th>
                          <th className="px-6 py-3">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierProducts.map((product) => {
                          const productId = String(
                            product._id || product.id || product.sku || "",
                          );
                          const historicalPurchasedQuantity = Number(
                            purchaseQuantityByProduct[productId] || 0,
                          );

                          return (
                            <tr
                              key={productId || product.sku}
                              className="border-t border-slate-100"
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                {product.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {product.sku}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700">
                                {historicalPurchasedQuantity}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700">
                                {formatCurrency(product.purchasePrice ?? 0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700">
                                {product.expiryDate
                                  ? new Date(
                                      product.expiryDate,
                                    ).toLocaleDateString()
                                  : "No expiry"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
