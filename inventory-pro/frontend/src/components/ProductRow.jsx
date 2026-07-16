import { Pencil } from "lucide-react";

export default function ProductRow({ product }) {
  const isLowStock = (product.quantity || 0) < 10;

  return (
    <tr className="border-t border-slate-100">
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
              {product.category || "General"}
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
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${isLowStock ? "text-red-600" : "text-emerald-600"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isLowStock ? "bg-red-500" : "bg-emerald-500"}`}
          />
          {product.quantity} Units
        </span>
      </td>
      <td className="px-5 py-3.5">
        <button
          className="text-slate-400 transition hover:text-slate-700"
          type="button"
        >
          <Pencil size={15} />
        </button>
      </td>
    </tr>
  );
}
