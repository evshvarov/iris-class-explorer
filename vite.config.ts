import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use /iris-table-stats-ui/ base only for IRIS deployment builds (npm run build:dist)
  const irisBase = process.env.IRIS_BUILD === "true" ? "/iris-table-stats-ui/" : "/";

  return {
    base: mode === "development" ? "/" : irisBase,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
