import { useEffect, useState } from "react";
import { api, type Product, type ProductInput } from "./api";

const empty: ProductInput = { name: "", sku: "", price: 0, stock: 0, category: "", active: true };

export default function App() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(query = q) {
    setLoading(true);
    try {
      setItems(await api.list(query));
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Load on mount; reload (debounced) whenever the search box changes.
  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api.remove(p.id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Products</h1>
        <div className="tools">
          <input
            className="search"
            placeholder="Search name / SKU / category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="primary" onClick={() => setEditing("new")}>+ New product</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Category</th><th>Active</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td className="mono">{p.sku}</td>
              <td>${p.price.toFixed(2)}</td>
              <td className={p.stock === 0 ? "out" : ""}>{p.stock}</td>
              <td>{p.category}</td>
              <td>{p.active ? <span className="pill on">active</span> : <span className="pill off">off</span>}</td>
              <td className="row-actions">
                <button onClick={() => setEditing(p)}>Edit</button>
                <button className="danger" onClick={() => remove(p)}>Delete</button>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr><td colSpan={7} className="empty">No products.</td></tr>
          )}
        </tbody>
      </table>

      {editing && (
        <EditModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          onError={setError}
        />
      )}
    </div>
  );
}

function EditModal(props: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const { product } = props;
  const [form, setForm] = useState<ProductInput>(
    product
      ? { name: product.name, sku: product.sku, price: product.price, stock: product.stock, category: product.category, active: !!product.active }
      : empty
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (product) await api.update(product.id, form);
      else await api.create(form);
      props.onSaved();
    } catch (err: any) {
      props.onError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="backdrop" onClick={props.onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h2>{product ? "Edit product" : "New product"}</h2>

        <label>Name<input required value={form.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label>SKU<input required value={form.sku} onChange={(e) => set("sku", e.target.value)} /></label>
        <div className="grid2">
          <label>Price<input type="number" step="0.01" min="0" value={form.price}
            onChange={(e) => set("price", Number(e.target.value))} /></label>
          <label>Stock<input type="number" step="1" min="0" value={form.stock}
            onChange={(e) => set("stock", Number(e.target.value))} /></label>
        </div>
        <label>Category<input value={form.category} onChange={(e) => set("category", e.target.value)} /></label>
        <label className="check">
          <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          Active
        </label>

        <div className="actions">
          <button type="button" onClick={props.onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
