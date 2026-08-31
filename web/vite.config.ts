import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api to the Express server so the browser talks to one origin (no CORS pain in dev).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://localhost:3001" },
  },
});
