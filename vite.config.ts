import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";
export default defineConfig({
  build: {
    outDir: "../dist",
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
});
