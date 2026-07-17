import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  reactCompiler.configs.recommended,
  // Custom project rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@next/next/no-img-element": "warn",
    },
  },
  // TanStack Table's useReactTable() is a known React Compiler incompatible API
  // (returns non-memoizable functions). No alternative hook exists; compiler skips
  // memoization for that component. Silence the advisory warning for the CMS table.
  {
    files: ["app/(dashboard)/admin/cms/_components/cms-content-table.tsx"],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
  // Ignores
  globalIgnores([
    "scripts/**",
    "quick-gsc-pull.js",
    "gsc-report-pull.js",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "scratch/**",
  ]),
]);

export default eslintConfig;
