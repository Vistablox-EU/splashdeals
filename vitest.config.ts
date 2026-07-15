import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    // Parent shells (e.g. NODE_ENV=production) strip React.act; force test mode.
    env: {
      NODE_ENV: "test",
    },
    coverage: {
      reportsDirectory: "tests/reports/coverage",
      provider: "v8",
      include: ["lib/**", "app/**"],
    },
  },
});
