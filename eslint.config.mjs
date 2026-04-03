import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Prettier — disables formatting rules that conflict with Prettier
  prettier,

  // Custom rules
  {
    rules: {
      // React
      "react/self-closing-comp": "warn",
      "react/jsx-no-target-blank": "error",
      "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Line length
      "max-len": ["warn", { code: 200, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true }],

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
    },
  },

  // Allow console.log in scripts
  {
    files: ["scripts/**"],
    rules: {
      "no-console": "off",
    },
  },

  // Override default ignores
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
