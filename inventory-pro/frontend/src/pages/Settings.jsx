import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const initialForm = {
  storeName: "",
  currency: "USD",
  taxRate: 0,
  address: "",
  logoUrl: "",
};

export default function Settings() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { logout, user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/settings");
        setForm({ ...initialForm, ...response.data });
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to load settings",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await api.put("/settings", { ...form, taxRate: Number(form.taxRate) });
      setMessage("Settings saved successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="flex min-h-screen bg-[#f3f4f2] font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <div className="flex flex-1 flex-col">
        <Topbar title="General settings" />
        <main className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">General settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure the store details used across your inventory system.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {loading ? (
              <p className="text-sm text-slate-500">Loading settings...</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Store name
                  <input
                    required
                    disabled={!canEdit}
                    value={form.storeName}
                    onChange={updateField("storeName")}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 disabled:bg-slate-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Currency code
                  <input
                    required
                    maxLength={3}
                    disabled={!canEdit}
                    value={form.currency}
                    onChange={updateField("currency")}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 uppercase outline-none focus:border-slate-400 disabled:bg-slate-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Tax rate (%)
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={!canEdit}
                    value={form.taxRate}
                    onChange={updateField("taxRate")}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 disabled:bg-slate-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Logo URL
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={form.logoUrl}
                    onChange={updateField("logoUrl")}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 disabled:bg-slate-100"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Store address
                  <textarea
                    rows="3"
                    disabled={!canEdit}
                    value={form.address}
                    onChange={updateField("address")}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 disabled:bg-slate-100"
                  />
                </label>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {message && (
              <p className="mt-4 text-sm text-emerald-600">{message}</p>
            )}
            {canEdit && !loading && (
              <button
                type="submit"
                disabled={saving}
                className="mt-6 flex items-center gap-2 rounded-lg bg-[#1a2540] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#253258] disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save settings"}
              </button>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
