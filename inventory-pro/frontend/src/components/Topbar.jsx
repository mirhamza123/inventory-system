import { Bell, ChevronDown, Search } from "lucide-react";

export default function Topbar({ title }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex max-w-2xl flex-1 items-center gap-3">
        <div className="hidden md:block text-sm font-semibold text-slate-700">
          {title}
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#f3f4f2] px-3.5 py-2 text-sm text-slate-400">
          <Search size={15} />
          <span>Search products, SKUs, or batches...</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
          All Categories
          <ChevronDown size={14} />
        </div>
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
