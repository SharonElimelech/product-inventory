import pg from "pg";

// Connection details come from env (docker run -e ...). Defaults = local run.
const pool = new pg.Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD ?? "postgres",
  database: process.env.PGDATABASE ?? "products",
});

// price::float8 forces a number (pg returns NUMERIC as string otherwise).
export const COLS =
  "id, name, sku, price::float8 AS price, stock, category, active, created_at";

export async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id         SERIAL PRIMARY KEY,
      name       TEXT    NOT NULL,
      sku        TEXT    NOT NULL UNIQUE,
      price      NUMERIC NOT NULL DEFAULT 0,
      stock      INTEGER NOT NULL DEFAULT 0,
      category   TEXT    NOT NULL DEFAULT '',
      active     BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM products");
  if (rows[0].n === 0) {
    const seed: [string, string, number, number, string, boolean][] = [
      ["Wireless Mouse", "WM-001", 24.9, 120, "Peripherals", true],
      ["Mechanical Keyboard", "KB-114", 89.0, 40, "Peripherals", true],
      ['27" Monitor', "MON-27", 219.99, 15, "Displays", true],
      ["USB-C Hub", "HUB-7", 39.5, 0, "Accessories", false],
    ];
    for (const s of seed) {
      await pool.query(
        "INSERT INTO products (name, sku, price, stock, category, active) VALUES ($1,$2,$3,$4,$5,$6)",
        s
      );
    }
  }
}

export default pool;
