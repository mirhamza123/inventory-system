import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, X } from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const filterActivitiesByDateRange = (activities, startDate, endDate) => {
  if (!startDate && !endDate) {
    return activities;
  }

  return activities.filter((activity) => {
    const activityTime = new Date(activity.date);

    if (Number.isNaN(activityTime.getTime())) {
      return false;
    }

    const normalizedStart = startDate
      ? new Date(`${startDate}T00:00:00`)
      : null;
    const normalizedEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;

    if (normalizedStart && activityTime < normalizedStart) {
      return false;
    }

    if (normalizedEnd && activityTime > normalizedEnd) {
      return false;
    }

    return true;
  });
};

const getDateRangeForTimeRange = (range) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate, endDate;

  switch (range) {
    case "today":
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "last7days":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "lastmonth":
      startDate = new Date(today);
      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date(today);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "alltime":
      startDate = null;
      endDate = null;
      break;
    default:
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

const filterTransactionsByDateRange = (transactions, startDate, endDate) => {
  if (!startDate && !endDate) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const txnTime = new Date(transaction.createdAt);
    if (Number.isNaN(txnTime.getTime())) return false;

    if (startDate && txnTime < startDate) return false;
    if (endDate && txnTime > endDate) return false;

    return true;
  });
};

export default function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [totalValue, setTotalValue] = useState("$0");
  const [totalPurchaseOrders, setTotalPurchaseOrders] = useState(0);
  const [totalSaleOrders, setTotalSaleOrders] = useState(0);
  const [poTotalCost, setPoTotalCost] = useState(0);
  const [soTotalRevenue, setSoTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeRange, setTimeRange] = useState("today");

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    );
    return ["All Categories", ...uniqueCategories];
  }, [products]);

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activities.filter((activity) => {
      const searchableText = [activity.product]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || searchableText.includes(query);

      const product = products.find((p) => p.name === activity.product);
      const normalizedCategory = String(product?.category || "General")
        .trim()
        .toLowerCase();
      const matchesCategory =
        selectedCategory === "All Categories" ||
        normalizedCategory === selectedCategory.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [activities, searchQuery, selectedCategory, products]);

  const historyActivities = useMemo(() => {
    return filterActivitiesByDateRange(filteredActivities, startDate, endDate);
  }, [filteredActivities, startDate, endDate]);

  // Calculate filtered Purchase Orders and Sale Orders based on timeRange or custom date range
  const { startDate: rangeStart, endDate: rangeEnd } = useMemo(() => {
    // If custom date range is set, use that; otherwise use timeRange
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);
      return { startDate: start, endDate: end };
    }
    return getDateRangeForTimeRange(timeRange);
  }, [timeRange, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, rangeStart, rangeEnd);
  }, [transactions, rangeStart, rangeEnd]);

  const filteredStats = useMemo(() => {
    const purchaseOrders = filteredTransactions.filter(
      (t) => t.type === "stock-in",
    );
    const saleOrders = filteredTransactions.filter(
      (t) => t.type === "stock-out",
    );

    const poCount = purchaseOrders.length;
    const soCount = saleOrders.length;

    const poCost = purchaseOrders.reduce((sum, t) => {
      const price = t.product?.price || 0;
      const qty = t.quantity || 0;
      return sum + price * qty;
    }, 0);

    const soRevenue = saleOrders.reduce((sum, t) => {
      const price = t.product?.price || 0;
      const qty = t.quantity || 0;
      return sum + price * qty;
    }, 0);

    return {
      poCount,
      soCount,
      poCost,
      soRevenue,
    };
  }, [filteredTransactions]);

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "last7days":
        return "Last 7 Days";
      case "lastmonth":
        return "Last Month";
      case "alltime":
        return "All Time";
      default:
        return "Today";
    }
  };

  const getActiveFilterLabel = () => {
    if (startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    return getTimeRangeLabel(timeRange);
  };

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

        setProducts(products);
        setTotalItems(products.length);
        setLowStockItems(products.filter((p) => (p.quantity || 0) < 10).length);
        const value = products.reduce(
          (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
          0,
        );
        setTotalValue(`$${value.toLocaleString()}`);

        // Store transactions for later filtering
        setTransactions(transactions);

        // Calculate purchase and sale orders with costs/revenue
        const purchaseOrders = transactions.filter(
          (t) => t.type === "stock-in",
        );
        const saleOrders = transactions.filter((t) => t.type === "stock-out");

        const poCount = purchaseOrders.length;
        const soCount = saleOrders.length;

        const poCost = purchaseOrders.reduce((sum, t) => {
          const price = t.product?.price || 0;
          const qty = t.quantity || 0;
          return sum + price * qty;
        }, 0);

        const soRevenue = saleOrders.reduce((sum, t) => {
          const price = t.product?.price || 0;
          const qty = t.quantity || 0;
          return sum + price * qty;
        }, 0);

        setTotalPurchaseOrders(poCount);
        setTotalSaleOrders(soCount);
        setPoTotalCost(poCost);
        setSoTotalRevenue(soRevenue);

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

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    // perform logout via AuthContext and redirect to login
    try {
      logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
    navigate("/");
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f2] text-[#1a2332]">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-[#e6e6e2] flex items-center justify-between px-6">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <label className="flex flex-1 items-center gap-2 rounded-lg bg-[#f3f4f2] px-3.5 py-2 text-sm text-slate-400">
              <Search size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search activities..."
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="bg-transparent outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {/* <ChevronDown size={14} className="pointer-events-none" /> */}
            </label>
          </div>

          <div className="flex items-center gap-6">
            {/* <span className="text-[#4a5060] text-lg cursor-pointer">🔔</span>
            <span className="text-[#4a5060] text-lg cursor-pointer">👤</span> */}
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

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6 bg-[#f9fafb] border border-[#eceee9] rounded-lg p-4">
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <label className="flex flex-1 flex-col text-sm font-medium text-slate-600 min-w-[150px]">
                <span className="mb-1 font-semibold">Start date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-1 flex-col text-sm font-medium text-slate-600 min-w-[150px]">
                <span className="mb-1 font-semibold">End date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-1 flex-col text-sm font-medium text-slate-600 min-w-[150px]">
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
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 whitespace-nowrap"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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

            <div className="bg-white rounded-xl border border-[#eceee9] p-4 border-l-red-500">
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

            <div className="bg-white rounded-xl border border-[#eceee9] p-4 border-l-green-900">
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

            <div className="bg-white rounded-xl border border-[#eceee9] p-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a8f9c]">
                  Purchase orders
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  🛒
                </div>
              </div>
              <div className="text-3xl font-bold">
                ${filteredStats.poCost.toLocaleString()}
              </div>
              <div className="text-sm text-[#2e9e5b] mt-2">
                {filteredStats.poCount} Completed Orders |{" "}
                {getActiveFilterLabel()}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#eceee9] p-4 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a8f9c]">
                  Sale orders
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  🏷️
                </div>
              </div>
              <div className="text-3xl font-bold">
                ${filteredStats.soRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-[#8a8f9c] mt-2">
                {filteredStats.soCount} Completed Orders |{" "}
                {getActiveFilterLabel()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#eceee9] mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eceee9]">
              <h3 className="text-sm font-bold">Recent Stock Activities</h3>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="text-sm text-[#4a5060] font-semibold"
              >
                View all ›
              </button>
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
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-6 text-center text-sm text-[#6b7280]"
                    >
                      No activities match your filter
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((a, i) => (
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

      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-4xl rounded-2xl border border-[#eceee9] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eceee9] px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Stock Activity History
                </h3>
                <p className="mt-1 text-xs text-[#767c8c]">
                  Filter transactions by date and review the full activity log.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close history modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-[#eceee9] bg-[#f9fafb] px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-1 flex-col gap-3 md:flex-row">
                  <label className="flex flex-1 flex-col text-sm font-medium text-slate-600">
                    <span className="mb-1">Start date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                    />
                  </label>
                  <label className="flex flex-1 flex-col text-sm font-medium text-slate-600">
                    <span className="mb-1">End date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto px-5 py-4">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-[#8a8f9c]">
                      Date &amp; time
                    </th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-[#8a8f9c]">
                      Product
                    </th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-[#8a8f9c]">
                      Action
                    </th>
                    <th className="px-3 py-3 text-right text-xs uppercase tracking-wider text-[#8a8f9c]">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-[#8a8f9c]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyActivities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-[#6b7280]"
                      >
                        No activities match the selected date range.
                      </td>
                    </tr>
                  ) : (
                    historyActivities.map((activity, index) => (
                      <tr
                        key={`${activity.date}-${index}`}
                        className="odd:bg-white even:bg-[#f9fafb]"
                      >
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {activity.date}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {activity.product}
                        </td>
                        <td
                          className={`px-3 py-3 align-top text-sm font-semibold ${activity.dir === "in" ? "text-[#2e9e5b]" : "text-[#d43d3d]"}`}
                        >
                          {activity.dir === "in" ? "↘" : "↗"} {activity.action}
                        </td>
                        <td className="px-3 py-3 align-top text-right text-sm font-bold text-slate-800">
                          {activity.qty}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2e9e5b]" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
