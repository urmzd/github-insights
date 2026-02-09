import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
