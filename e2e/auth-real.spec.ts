import { test, expect } from "@playwright/test";
import { retryGoto } from "./test-helpers";
test.describe("Real Authentication Flow", () => {
    const TEST_EMAIL = process.env.TEST_USER_EMAIL;
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isConfigured = !!(TEST_EMAIL && TEST_PASSWORD && SUPABASE_URL && SUPABASE_KEY);
    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();
        if (!isConfigured) {
            test.skip();
        }
    });
    test("should login with real credentials", async ({ page }) => {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            test.skip();
            return;
        }
        await retryGoto(page, "/login", { waitUntil: "networkidle" });
        await page.waitForLoadState("domcontentloaded");
        await page.getByLabel(/email/i).fill(TEST_EMAIL!);
        await page.getByLabel(/senha/i).fill(TEST_PASSWORD!);
        await page.getByRole("button", { name: /entrar/i }).click();
        await page.waitForTimeout(2000);
        const errorSelectors = [
            page.locator('[data-sonner-toast]').filter({ hasText: /erro|error|invalid|incorrect|wrong/i }),
            page.locator('[role="status"]').filter({ hasText: /erro|error/i }),
            page.getByText(/erro|error|invalid|incorrect/i),
        ];
        for (const errorSelector of errorSelectors) {
            const hasError = await errorSelector.isVisible({ timeout: 1000 }).catch(() => false);
            if (hasError) {
                const errorText = await errorSelector.textContent().catch(() => "Unknown error");
                await page.screenshot({ path: "test-results/login-error.png", fullPage: true });
                throw new Error(`Login failed: ${errorText}. Check TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test`);
            }
        }
        try {
            await page.waitForURL(/\/dashboard/, { timeout: 15000 });
        }
        catch (error) {
            const currentUrl = page.url();
            const pageContent = await page.textContent("body").catch(() => "");
            await page.screenshot({ path: "test-results/login-timeout.png", fullPage: true });
            throw new Error(`Login timeout. Current URL: ${currentUrl}\n` +
                `Possíveis causas:\n` +
                `1. Credenciais inválidas: Verifique TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.test\n` +
                `2. Usuário não existe: Crie o usuário no Supabase Dashboard > Authentication > Users\n` +
                `3. Supabase não configurado: Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY\n` +
                `4. Email não confirmado: Se email confirmation estiver ativado, confirme o email primeiro\n` +
                `\nScreenshot salvo em: test-results/login-timeout.png`);
        }
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText(/meus documentos/i)).toBeVisible({ timeout: 10000 });
    });
    test("should logout successfully", async ({ page }) => {
        await retryGoto(page, "/login", { waitUntil: "networkidle" });
        await page.waitForLoadState("domcontentloaded");
        await page.getByLabel(/email/i).fill(TEST_EMAIL!);
        await page.getByLabel(/senha/i).fill(TEST_PASSWORD!);
        await page.getByRole("button", { name: /entrar/i }).click();
        await page.waitForURL(/\/dashboard/, { timeout: 15000 });
        try {
            await expect(page.getByText(/meus documentos/i)).toBeVisible({ timeout: 5000 });
        }
        catch {
            const avatarButton = page.locator('button[class*="rounded-full"]').last();
            await expect(avatarButton).toBeVisible({ timeout: 5000 });
        }
        const avatarSelectors = [
            page.locator('button:has([data-slot="avatar"])'),
            page.locator('button:has([data-slot="avatar-fallback"])'),
            page.locator('button[class*="rounded-full"]').filter({ has: page.locator('[data-slot="avatar"]') }),
            page.locator('button[class*="rounded-full"]').nth(1),
        ];
        let avatarButton = null;
        for (const selector of avatarSelectors) {
            const isVisible = await selector.isVisible({ timeout: 2000 }).catch(() => false);
            if (isVisible) {
                avatarButton = selector;
                break;
            }
        }
        if (!avatarButton) {
            avatarButton = page.locator('button[class*="rounded-full"]').last();
        }
        await page.waitForLoadState("networkidle");
        await expect(avatarButton).toBeVisible({ timeout: 5000 });
        await avatarButton.waitFor({ state: "visible", timeout: 5000 });
        await page.waitForTimeout(300);
        try {
            await avatarButton.click({ timeout: 10000 });
        }
        catch (error) {
            await page.waitForTimeout(500);
            await avatarButton.click({ force: true, timeout: 5000 });
        }
        await page.waitForTimeout(500);
        const menuSelectors = [
            page.locator('[data-slot="dropdown-menu-content"]'),
            page.locator('[role="menu"]'),
            page.locator('div:has-text("Dashboard")'),
        ];
        let menuFound = false;
        for (const selector of menuSelectors) {
            const visible = await selector.isVisible({ timeout: 2000 }).catch(() => false);
            if (visible) {
                menuFound = true;
                break;
            }
        }
        if (!menuFound) {
            await page.screenshot({ path: "test-results/logout-menu-not-opened.png", fullPage: true });
            await avatarButton.click({ force: true });
            await page.waitForTimeout(1000);
        }
        const logoutSelectors = [
            page.getByRole("menuitem", { name: /sair/i }),
            page.locator('button:has-text("Sair")'),
            page.locator('[data-slot="dropdown-menu-item"]:has-text("Sair")'),
            page.getByText(/sair/i),
        ];
        let logoutItem = null;
        for (const selector of logoutSelectors) {
            const visible = await selector.isVisible({ timeout: 3000 }).catch(() => false);
            if (visible) {
                logoutItem = selector;
                break;
            }
        }
        if (!logoutItem) {
            await page.screenshot({ path: "test-results/logout-item-not-found.png", fullPage: true });
            throw new Error("Could not find logout menu item 'Sair'. Menu may not have opened correctly.");
        }
        await logoutItem.click();
        const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /logout|sucesso/i });
        await successToast.isVisible({ timeout: 2000 }).catch(() => {
        });
        await page.waitForURL(/\/login/, { timeout: 5000 });
        await expect(page).toHaveURL(/\/login/);
    });
});
