import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Vite's dev server runs standalone on its own port (proxying /api to
  // Express) - it doesn't need the /is-audit prefix, and forcing it just
  // breaks plain URLs like localhost:5173/findings. The prefix is only
  // needed for the production build, where Express serves the built SPA
  // under /is-audit (see server/src/app.js). Vercel serves from the
  // domain root, so it never needs a prefix either.
  base: process.env.VERCEL ? "/" : command === "build" ? "/is-audit/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
}));
