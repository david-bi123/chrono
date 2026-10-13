import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    testTimeout: 30000,
    // Integration tests hit a real local MongoDB; units stay instant.
  },
});
