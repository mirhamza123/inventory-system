export default function Topbar({ title }) {
  return (
    <header className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <input
          className="rounded border border-slate-200 px-3 py-2"
          placeholder="Search"
        />
        <div className="rounded-full bg-slate-200 px-3 py-2 text-sm">Admin</div>
      </div>
    </header>
  );
}
