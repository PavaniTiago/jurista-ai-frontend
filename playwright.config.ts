import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env.test") });
const authFile = path.resolve(__dirname, "playwright", ".auth", "user.json");
export default defineConfig({
    testDir: "./e2e",
    globalSetup: path.resolve(__dirname, "e2e", "global.setup.ts"),
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        navigationTimeout: 30000,
        actionTimeout: 10000,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                storageState: authFile,
            },
        },
        {
            name: "firefox",
            use: {
                ...devices["Desktop Firefox"],
                storageState: authFile,
            },
        },
        {
            name: "webkit",
            use: {
                ...devices["Desktop Safari"],
                storageState: authFile,
            },
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
