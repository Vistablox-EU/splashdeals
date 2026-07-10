/**
 * Standalone ESLint config for fixing import ordering only.
 * Used by: npm run lint:fix-imports
 */
import { importX, flatConfigs } from "eslint-plugin-import-x";

export default [
  {
    plugins: { import: importX },
    rules: {
      "import-x/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
        node: true,
      },
    },
  },
];
