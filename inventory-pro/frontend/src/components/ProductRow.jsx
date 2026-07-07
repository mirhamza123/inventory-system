export default function ProductRow({ product }) {
  return (
    <tr className="border-b text-sm text-slate-700">
      <td className="px-4 py-3">{product.name}</td>
      <td className="px-4 py-3">{product.sku}</td>
      <td className="px-4 py-3">{product.category}</td>
      <td className="px-4 py-3">${product.price}</td>
      <td className="px-4 py-3">{product.quantity}</td>
    </tr>
  );
}
