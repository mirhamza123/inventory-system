import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const currencyOptions = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "PKR", symbol: "Rs" },
  { code: "INR", symbol: "₹" },
  { code: "AED", symbol: "د.إ" },
  { code: "SAR", symbol: "﷼" },
  { code: "QAR", symbol: "ر.ق" },
  { code: "JPY", symbol: "¥" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
];

const initialForm = {
  storeName: "",
  currency: "USD",
  currencySymbol: "$",
  address: "",
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const getDisplayCurrencySymbol = (symbol) => {
  const value = String(symbol || "$")
    .trim()
    .replace(/\s+/g, "");

  if (value.length > 2 && value.endsWith("$") && /[A-Za-z]/.test(value)) {
    return value.slice(0, -1);
  }

  return value;
};

export default function Settings() {
  const [form, setForm] = useState(initialForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { logout, user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/settings");
        const settings = response.data || {};
        const currencyCode = settings.currency || "USD";
        const matchedCurrency =
          currencyOptions.find((option) => option.code === currencyCode) ||
          currencyOptions[0];

        const nextForm = {
          ...initialForm,
          ...settings,
          currency: currencyCode,
          currencySymbol: getDisplayCurrencySymbol(
            settings.currencySymbol || matchedCurrency.symbol,
          ),
        };

        setForm(nextForm);
        localStorage.setItem("storeName", nextForm.storeName || "InventoryPro");
        localStorage.setItem(
          "currencySymbol",
          getDisplayCurrencySymbol(
            nextForm.currencySymbol || matchedCurrency.symbol,
          ),
        );
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
      const normalizedCurrencySymbol = getDisplayCurrencySymbol(
        form.currencySymbol || "$",
      );

      const payload = {
        ...form,
        currency: form.currency || "USD",
        currencySymbol: normalizedCurrencySymbol,
      };

      const response = await api.put("/settings", payload);

      const nextStoreName =
        response.data?.storeName || form.storeName || "InventoryPro";
      const nextCurrencySymbol = getDisplayCurrencySymbol(
        response.data?.currencySymbol || form.currencySymbol || "$",
      );

      localStorage.setItem("storeName", nextStoreName);
      localStorage.setItem("currencySymbol", nextCurrencySymbol);

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

  const handleCurrencyChange = (event) => {
    const selected =
      currencyOptions.find((option) => option.code === event.target.value) ||
      currencyOptions[0];

    setForm((current) => ({
      ...current,
      currency: selected.code,
      currencySymbol: selected.symbol,
    }));
  };

  const updatePasswordField = (field) => (event) =>
    setPasswordForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    const token = localStorage.getItem("token");

    setPasswordSaving(true);

    try {
      const response = await api.put(
        "/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      setPasswordMessage(
        response.data?.message || "Password updated successfully!",
      );
      setPasswordForm(initialPasswordForm);
    } catch (requestError) {
      const serverMessage =
        requestError?.response?.data?.message || "Unable to update password.";
      setPasswordError(serverMessage);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f2] font-sans text-slate-900">
      <div className="h-screen flex-shrink-0 overflow-hidden">
        <Sidebar onLogout={logout} />
      </div>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar title="General settings" />
        <main className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your store configuration and account security.
            </p>
          </div>

          <div className="max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {[
                { key: "general", label: "General Settings" },
                { key: "password", label: "Change Password" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-[#1a2540] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "general" && (
              <form onSubmit={handleSubmit}>
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
                      <select
                        required
                        disabled={!canEdit}
                        value={form.currency}
                        onChange={handleCurrencyChange}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 disabled:bg-slate-100"
                      >
                        {currencyOptions.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.code} {option.symbol}
                          </option>
                        ))}
                      </select>
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
            )}

            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="max-w-xl">
                <div className="space-y-5">
                  <label className="block text-sm font-medium text-slate-700">
                    Current Password
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={updatePasswordField("currentPassword")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    New Password
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={updatePasswordField("newPassword")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Confirm Password
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={updatePasswordField("confirmPassword")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    />
                  </label>
                </div>

                {passwordError && (
                  <p className="mt-4 text-sm text-red-600">{passwordError}</p>
                )}
                {passwordMessage && (
                  <p className="mt-4 text-sm text-emerald-600">
                    {passwordMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="mt-6 flex items-center gap-2 rounded-lg bg-[#1a2540] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#253258] disabled:opacity-60"
                >
                  <Save size={16} />
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
