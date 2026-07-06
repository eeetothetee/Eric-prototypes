import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // For GitHub Pages the app is served from a repo subpath, so the CI build
  // passes VITE_BASE (e.g. "/Eric-prototypes/"). Locally it defaults to "/".
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
