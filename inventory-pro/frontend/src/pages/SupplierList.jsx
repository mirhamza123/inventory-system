import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Trash2,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const emptySupplierForm = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  address: "",
};

const emptyPurchaseForm = {
  supplierId: "",
  productId: "",
  quantity: "",
  unitCost: "",
  amountPaidNow: "",
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getQuickFilterDates = (filter) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case "today":
      return {
        startDate: formatDateInput(today),
        endDate: formatDateInput(today),
      };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: formatDateInput(yesterday),
        endDate: formatDateInput(yesterday),
      };
    }
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(today),
      };
    }
    case "lastmonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
      };
    }
    default:
      return { startDate: "", endDate: "" };
  }
};

const formatCurrency = (value) => {
  const currencySymbol = localStorage.getItem("currencySymbol") || "$";
  return `${currencySymbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [deletingSupplierId, setDeletingSupplierId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeRange, setTimeRange] = useState("alltime");
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const [supplierSummary, setSupplierSummary] = useState({
    totalPurchased: 0,
    totalPayable: 0,
  });
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load suppliers", error);
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load products", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchProducts()]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    const selectedDates =
      timeRange === "custom"
        ? { startDate, endDate }
        : getQuickFilterDates(timeRange);
    const params = {};

    if (selectedDates.startDate) params.startDate = selectedDates.startDate;
    if (selectedDates.endDate) params.endDate = selectedDates.endDate;

    const fetchSummary = async () => {
      try {
        const response = await api.get("/suppliers/summary", { params });
        if (isCurrentRequest) {
          setSupplierSummary({
            totalPurchased: Number(response.data?.totalPurchased || 0),
            totalPayable: Number(response.data?.totalPayable || 0),
          });
        }
      } catch (error) {
        console.error("Failed to load supplier summary", error);
      }
    };

    fetchSummary();
    return () => {
      isCurrentRequest = false;
    };
  }, [startDate, endDate, timeRange, summaryRefreshKey]);

  const summary = useMemo(() => {
    return {
      count: suppliers.length,
      totalPurchased: supplierSummary.totalPurchased,
      totalPayable: supplierSummary.totalPayable,
    };
  }, [suppliers.length, supplierSummary]);

  const handleCreateSupplier = async (event) => {
    event.preventDefault();

    try {
      await api.post("/suppliers", {
        ...supplierForm,
        name: supplierForm.name.trim(),
        companyName: supplierForm.companyName.trim(),
        email: supplierForm.email.trim(),
        phone: supplierForm.phone.trim(),
        address: supplierForm.address.trim(),
      });

      setSupplierForm(emptySupplierForm);
      setIsSupplierModalOpen(false);
      await fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add supplier");
    }
  };

  const openPurchaseModal = (supplier) => {
    setPurchaseForm({
      ...emptyPurchaseForm,
      supplierId: supplier._id || supplier.id,
    });
    setIsPurchaseModalOpen(true);
  };

  const handleDeleteSupplier = async (supplier) => {
    const supplierId = supplier._id || supplier.id;
    const confirmed = window.confirm(
      `Delete supplier "${supplier.name}"? Existing purchase history will be retained.`,
    );

    if (!confirmed) return;

    setDeletingSupplierId(supplierId);
    try {
      await api.delete(`/suppliers/${supplierId}`);
      await fetchSuppliers();
      setSummaryRefreshKey((current) => current + 1);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete supplier");
    } finally {
      setDeletingSupplierId("");
    }
  };

  const selectedProduct = products.find(
    (product) => (product._id || product.id) === purchaseForm.productId,
  );
  const unitCost = Number(purchaseForm.unitCost || 0);
  const quantity = Number(purchaseForm.quantity || 0);
  const amountPaidNow = Number(purchaseForm.amountPaidNow || 0);
  const totalAmount = quantity * unitCost;
  const payableAdded = Math.max(totalAmount - amountPaidNow, 0);

  const handleSavePurchase = async (event) => {
    event.preventDefault();

    if (!purchaseForm.supplierId || !purchaseForm.productId) {
      alert("Please select a supplier and a product.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      alert("Please enter a valid unit cost.");
      return;
    }

    try {
      await api.post("/suppliers/purchases", {
        supplierId: purchaseForm.supplierId,
        productId: purchaseForm.productId,
        quantity,
        unitCost,
        amountPaidNow,
      });

      setPurchaseForm(emptyPurchaseForm);
      setIsPurchaseModalOpen(false);
      await Promise.all([fetchSuppliers(), fetchProducts()]);
      setSummaryRefreshKey((current) => current + 1);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to record purchase");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f2] font-sans text-slate-900">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              {/* <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Suppliers
              </p> */}
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Supplier management
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253258]"
            >
              <Plus size={16} />
              Add Supplier
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end">
            <label className="flex min-w-[150px] flex-1 flex-col text-sm font-medium text-slate-600">
              <span className="mb-1 font-semibold">Start Date</span>
              <input
                type="date"
                value={
                  timeRange === "custom"
                    ? startDate
                    : getQuickFilterDates(timeRange).startDate
                }
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setTimeRange("custom");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
            </label>
            <label className="flex min-w-[150px] flex-1 flex-col text-sm font-medium text-slate-600">
              <span className="mb-1 font-semibold">End Date</span>
              <input
                type="date"
                value={
                  timeRange === "custom"
                    ? endDate
                    : getQuickFilterDates(timeRange).endDate
                }
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setTimeRange("custom");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
            </label>
            <label className="flex min-w-[170px] flex-1 flex-col text-sm font-medium text-slate-600">
              <span className="mb-1 font-semibold">Quick Filter</span>
              <select
                value={timeRange}
                onChange={(event) => setTimeRange(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="lastmonth">Last Month</option>
                <option value="alltime">All Time</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setTimeRange("alltime");
              }}
              className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Clear Filters
            </button>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Suppliers</span>
                <Building2 className="text-emerald-600" size={18} />
              </div>
              <div className="mt-4 text-2xl font-bold text-slate-900">
                {summary.count}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total purchased</span>
                <ReceiptText className="text-blue-600" size={18} />
              </div>
              <div className="mt-4 text-2xl font-bold text-slate-900">
                {formatCurrency(summary.totalPurchased)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total payable</span>
                <CircleDollarSign className="text-amber-600" size={18} />
              </div>
              <div className="mt-4 text-2xl font-bold text-slate-900">
                {formatCurrency(summary.totalPayable)}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Suppliers</h3>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Loading suppliers...
              </div>
            ) : suppliers.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No suppliers added yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Supplier / Company</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Purchased</th>
                      <th className="px-5 py-3">Paid</th>
                      <th className="px-5 py-3">Payable</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier._id || supplier.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                              <Truck size={16} />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {supplier.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {supplier.companyName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          <div>{supplier.phone || "-"}</div>
                          <div className="text-xs text-slate-400">
                            {supplier.address || "No address"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {formatCurrency(supplier.totalPurchased || 0)}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {formatCurrency(supplier.totalPaid || 0)}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-amber-700">
                          {formatCurrency(supplier.totalPayable || 0)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/suppliers/${supplier._id || supplier.id}`}
                              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => openPurchaseModal(supplier)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              <ReceiptText size={12} />
                              Record Purchase
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(supplier)}
                              disabled={
                                deletingSupplierId ===
                                (supplier._id || supplier.id)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={12} />
                              {deletingSupplierId ===
                              (supplier._id || supplier.id)
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        open={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Add Supplier"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Supplier Name
            </label>
            <input
              type="text"
              value={supplierForm.name}
              onChange={(event) =>
                setSupplierForm({ ...supplierForm, name: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Company Name
            </label>
            <input
              type="text"
              value={supplierForm.companyName}
              onChange={(event) =>
                setSupplierForm({
                  ...supplierForm,
                  companyName: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={supplierForm.email}
              onChange={(event) =>
                setSupplierForm({ ...supplierForm, email: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              type="text"
              value={supplierForm.phone}
              onChange={(event) =>
                setSupplierForm({ ...supplierForm, phone: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              value={supplierForm.address}
              onChange={(event) =>
                setSupplierForm({
                  ...supplierForm,
                  address: event.target.value,
                })
              }
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#1a2540] px-4 py-2 text-sm font-semibold text-white"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Record Purchase"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Supplier
            </label>
            <select
              value={purchaseForm.supplierId}
              onChange={(event) =>
                setPurchaseForm({
                  ...purchaseForm,
                  supplierId: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option
                  key={supplier._id || supplier.id}
                  value={supplier._id || supplier.id}
                >
                  {supplier.name} - {supplier.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Product
            </label>
            <select
              value={purchaseForm.productId}
              onChange={(event) =>
                setPurchaseForm({
                  ...purchaseForm,
                  productId: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option
                  key={product._id || product.id}
                  value={product._id || product.id}
                >
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={purchaseForm.quantity}
                onChange={(event) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    quantity: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Unit Cost
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchaseForm.unitCost}
                onChange={(event) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    unitCost: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount Paid Now
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchaseForm.amountPaidNow}
              onChange={(event) =>
                setPurchaseForm({
                  ...purchaseForm,
                  amountPaidNow: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Total Amount</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Credit / Payable Added</span>
              <strong>{formatCurrency(payableAdded)}</strong>
            </div>
            {selectedProduct && (
              <div className="flex items-center justify-between">
                <span>Selected Product</span>
                <strong>{selectedProduct.name}</strong>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#1a2540] px-4 py-2 text-sm font-semibold text-white"
            >
              Save Purchase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
