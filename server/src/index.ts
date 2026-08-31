import express from "express";
import cors from "cors";
import { z } from "zod";
import pool, { COLS, init } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const ProductInput = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().trim().default(""),
  active: z.boolean().default(true),
});

// List (optional ?q= search over name/sku/category)
app.get("/api/products", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q) {
    const like = `%${q}%`;
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM products WHERE name ILIKE $1 OR sku ILIKE $1 OR category ILIKE $1 ORDER BY id DESC`,
      [like]
    );
    return res.json(rows);
  }
  const { rows } = await pool.query(`SELECT ${COLS} FROM products ORDER BY id DESC`);
  res.json(rows);
});

app.get("/api/products/:id", async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM products WHERE id = $1`, [
    req.params.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

app.post("/api/products", async (req, res) => {
  const parsed = ProductInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, sku, price, stock, category, active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${COLS}`,
      [p.name, p.sku, p.price, p.stock, p.category, p.active]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.code === "23505") return res.status(409).json({ error: "SKU already exists" });
    throw e;
  }
});

app.put("/api/products/:id", async (req, res) => {
  const parsed = ProductInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;
  try {
    const { rows } = await pool.query(
      `UPDATE products SET name=$1, sku=$2, price=$3, stock=$4, category=$5, active=$6
       WHERE id=$7 RETURNING ${COLS}`,
      [p.name, p.sku, p.price, p.stock, p.category, p.active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    if (e.code === "23505") return res.status(409).json({ error: "SKU already exists" });
    throw e;
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [
    req.params.id,
  ]);
  if (rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

const port = Number(process.env.PORT ?? 3001);
// Build table + seed before we start listening.
init().then(() => app.listen(port, () => console.log(`API on http://localhost:${port}`)));
