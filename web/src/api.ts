export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  active: number; // SQLite stores boolean as 0/1
  created_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at" | "active"> & {
  active: boolean;
};

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.toString?.() || body.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  list: (q = "") => req<Product[]>(`/api/products?q=${encodeURIComponent(q)}`),
  create: (p: ProductInput) => req<Product>("/api/products", { method: "POST", body: JSON.stringify(p) }),
  update: (id: number, p: ProductInput) =>
    req<Product>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  remove: (id: number) => req<void>(`/api/products/${id}`, { method: "DELETE" }),
};
