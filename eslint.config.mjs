import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "@next/next/no-img-element": "warn",
      "no-console": "warn",
      "no-debugger": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-fallthrough": "error",
      "no-redeclare": "error",
      "no-unreachable": "error",
    },
  },
  {
    files: ["src/scripts/seed-state-requirements.ts"],
    rules: {
      // This generated one-off seed file keeps counters for readable CLI output.
      // Treat style-only const suggestions as warnings while preserving safety errors.
      "prefer-const": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "examples/**",
      "skills/**",
      "upload/**",
    ],
  },
];

export default eslintConfig;
