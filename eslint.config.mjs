import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow 'any' type with warning instead of error (can be fixed gradually)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Allow unused vars that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      
      // Allow require() in scripts and config files (disable for now, can be enabled later)
      "@typescript-eslint/no-require-imports": "off",
      
      // React hooks - warn instead of error
      "react-hooks/exhaustive-deps": "warn",
      
      // Next.js image - warn instead of error
      "@next/next/no-img-element": "warn",
      
      // React unescaped entities - warn
      "react/no-unescaped-entities": "warn",
      
      // Prefer const - auto-fixable
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
