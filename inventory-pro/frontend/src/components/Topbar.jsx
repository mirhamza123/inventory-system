import { Bell, ChevronDown, Search } from "lucide-react";

export default function Topbar({
  title,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories = [],
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex max-w-2xl flex-1 items-center gap-3">
        <div className="hidden text-sm font-semibold text-slate-700 md:block">
          {title}
        </div>
        <label className="flex flex-1 items-center gap-2 rounded-lg bg-[#f3f4f2] px-3.5 py-2 text-sm text-slate-400">
          <Search size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products, SKUs, or brands..."
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

      <div className="flex items-center gap-4">
        <Bell size={17} className="cursor-pointer text-slate-500" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
          AU
        </div>
      </div>
    </header>
  );
}
