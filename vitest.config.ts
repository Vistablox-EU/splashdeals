import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      reportsDirectory: "tests/reports/coverage",
      provider: "v8",
      include: ["lib/**", "app/**"],
    },
  },
});
