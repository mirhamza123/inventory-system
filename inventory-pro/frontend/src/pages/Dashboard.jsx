import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [totalValue, setTotalValue] = useState("$0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, transactionsRes] = await Promise.all([
          api.get("/products"),
          api.get("/stock"),
        ]);

        if (!mounted) return;

        const products = productsRes.data || [];
        const transactions = transactionsRes.data || [];

        setTotalItems(products.length);
        setLowStockItems(products.filter((p) => (p.quantity || 0) < 10).length);
        const value = products.reduce(
          (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
          0,
        );
        setTotalValue(`$${value.toLocaleString()}`);

        // Map transactions into the UI-friendly shape
        const mapped = transactions.map((t) => ({
          date: new Date(t.createdAt).toLocaleString(),
          product: t.product?.name || "Product",
          action: t.type === "stock-in" ? "Stock In" : "Stock Out",
          qty: (t.type === "stock-in" ? "+" : "-") + t.quantity,
          dir: t.type === "stock-in" ? "in" : "out",
        }));
        setActivities(mapped);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (!mounted) {
          return;
        }
        setActivities([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    console.log("logout");
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f2] text-[#1a2332]">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-[#e6e6e2] flex items-center justify-between px-6">
          <div className="search bg-[#f3f4f2] rounded-lg px-3 py-2 w-80 text-sm text-[#8a8f9c] flex items-center">
            🔍 Search inventory...
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[#4a5060] text-lg cursor-pointer">🔔</span>
            <span className="text-[#4a5060] text-lg cursor-pointer">👤</span>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-semibold">Admin User</div>
                <div className="text-xs text-[#8a8f9c]">Warehouse Alpha</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#d9dce2] flex items-center justify-center text-xs font-bold text-[#4a5060]">
                AU
              </div>
            </div>
          </div>
        </header>

        <main className="p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <p className="text-sm text-[#767c8c] mt-1">
                Real-time status of your warehouse inventory.
              </p>
            </div>
            <button
              onClick={() => console.log("Open transaction modal")}
              className="bg-[#1a2540] text-white rounded-lg px-4 py-2 font-semibold"
            >
              + New Stock Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-[#eceee9] p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a8f9c]">
                  Total items
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#e8ecfb] text-[#3d54d4] flex items-center justify-center">
                  ▦
                </div>
              </div>
              <div className="text-3xl font-bold">{totalItems}</div>
              <div className="text-sm text-[#2e9e5b] mt-2">
                ↗ +4.2% from last month
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#eceee9] p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a8f9c]">
                  Low stock items
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fbe6e6] text-[#d43d3d] flex items-center justify-center">
                  ⚠
                </div>
              </div>
              <div className="text-3xl font-bold text-[#d43d3d]">
                {lowStockItems}
              </div>
              <div className="text-sm text-[#d43d3d] font-semibold mt-2">
                ! Requires immediate restock
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#eceee9] p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a8f9c]">
                  Total stock value
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#e8ecfb] text-[#3d54d4] flex items-center justify-center">
                  💰
                </div>
              </div>
              <div className="text-3xl font-bold">{totalValue}</div>
              <div className="text-sm text-[#8a8f9c] mt-2">
                🕐 Updated 5 mins ago
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#eceee9] mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eceee9]">
              <h3 className="text-sm font-bold">Recent Stock Activities</h3>
              <a href="#" className="text-sm text-[#4a5060] font-semibold">
                View all ›
              </a>
            </div>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase tracking-wider text-[#8a8f9c] px-5 py-3">
                    Date &amp; time
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-[#8a8f9c] px-5 py-3">
                    Product
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-[#8a8f9c] px-5 py-3">
                    Action
                  </th>
                  <th className="text-right text-xs uppercase tracking-wider text-[#8a8f9c] px-5 py-3">
                    Quantity
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-[#8a8f9c] px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-6 text-center text-sm text-[#6b7280]"
                    >
                      Loading recent transactions...
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-6 text-center text-sm text-[#6b7280]"
                    >
                      No recent transactions found
                    </td>
                  </tr>
                ) : (
                  activities.map((a, i) => (
                    <tr key={i} className="odd:bg-white even:bg-white">
                      <td className="px-5 py-4 align-top">{a.date}</td>
                      <td className="px-5 py-4 align-top">{a.product}</td>
                      <td
                        className={`px-5 py-4 align-top ${a.dir === "in" ? "text-[#2e9e5b] font-semibold" : "text-[#d43d3d] font-semibold"}`}
                      >
                        {a.dir === "in" ? "↘" : "↗"} {a.action}
                      </td>
                      <td className="px-5 py-4 align-top text-right font-bold">
                        {a.qty}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2e9e5b]"></span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-6 panel-dark bg-[#1a2540] text-white">
              <h4 className="text-lg font-bold mb-2">Inventory audit</h4>
              <p className="opacity-90 mb-4">
                Run a full digital audit of your warehouse floor to ensure data
                accuracy.
              </p>
              <button className="bg-[#3ecf8e] text-[#08341f] font-bold px-4 py-2 rounded-md">
                Start audit
              </button>
            </div>

            <div className="rounded-xl p-6 panel-light bg-[#cfd2ce] text-[#1a2332]">
              <h4 className="text-lg font-bold mb-2">Warehouse analytics</h4>
              <p className="mb-4">
                Deep dive into inventory turnover rates and demand forecasting
                models.
              </p>
              <button className="bg-[#1a2540] text-white font-bold px-4 py-2 rounded-md">
                View reports
              </button>
            </div>
          </div> */}
        </main>
      </div>
    </div>
  );
}
