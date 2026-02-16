import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
  }),

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
