import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.test") });
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "happy-dom",
        globals: true,
        setupFiles: ["./src/tests/setup.ts"],
        exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/e2e/**",
            "**/playwright-report/**",
            "**/test-results/**",
            "**/*.spec.ts",
            "**/e2e/**/*.spec.ts",
        ],
        include: [
            "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "src/tests/",
                "e2e/",
                "**/*.d.ts",
                "**/*.config.*",
                "**/mockData",
                "**/.next/**",
            ],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
