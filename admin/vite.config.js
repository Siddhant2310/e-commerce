import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Admin runs on port 5174 (the customer site uses 5173).
// /api is forwarded to the backend, so no CORS setup is needed in development.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true, proxy: { "/api": "http://localhost:3001" } },
});
