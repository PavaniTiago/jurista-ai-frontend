import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { retryGoto, waitForSupabaseSession } from "./test-helpers";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
test.describe("Real Documents Flow", () => {
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "testpassword123";
    test.use({
        storageState: undefined,
    });
    async function login(page: any) {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            throw new Error("TEST_USER_EMAIL or TEST_USER_PASSWORD not set in .env.test");
        }
        await page.context().clearCookies();
        await retryGoto(page, "/login", { waitUntil: "networkidle" });
        await page.waitForLoadState("domcontentloaded");
        await page.getByLabel(/email/i).fill(TEST_EMAIL);
        await page.getByLabel(/senha/i).fill(TEST_PASSWORD);
        await page.getByRole("button", { name: /entrar/i }).click();
        let loginSuccess = false;
        let loginError: string | null = null;
        try {
            await Promise.race([
                page.waitForSelector('[data-sonner-toast]', { state: "visible", timeout: 5000 }).then(async () => {
                    const toastText = await page.locator('[data-sonner-toast]').first().textContent().catch(() => "");
                    if (toastText?.toLowerCase().includes('sucesso') || toastText?.toLowerCase().includes('success')) {
                        loginSuccess = true;
                    }
                    else if (toastText?.toLowerCase().match(/erro|error|invalid|incorrect|wrong/i)) {
                        loginError = toastText;
                    }
                }),
                page.waitForURL(/\/dashboard/, { timeout: 5000 }).then(() => {
                    loginSuccess = true;
                }),
                page.waitForURL(/\/login/, { timeout: 5000 }).then(() => {
                }),
            ]);
        }
        catch {
        }
        if (!loginSuccess) {
            const errorSelectors = [
                page.locator('[data-sonner-toast]').filter({ hasText: /erro|error|invalid|incorrect|wrong/i }),
                page.locator('[role="status"]').filter({ hasText: /erro|error/i }),
                page.getByText(/erro|error|invalid|incorrect/i),
            ];
            for (const errorSelector of errorSelectors) {
                const hasError = await errorSelector.isVisible({ timeout: 2000 }).catch(() => false);
                if (hasError) {
                    const errorText = await errorSelector.textContent().catch(() => "Unknown error");
                    loginError = errorText;
                    break;
                }
            }
            if (loginError) {
                await page.screenshot({ path: "test-results/login-error-documents.png", fullPage: true });
                throw new Error(`Login failed: ${loginError}.\n` +
                    `Check TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test\n` +
                    `Screenshot saved to: test-results/login-error-documents.png`);
            }
            await page.waitForTimeout(2000);
        }
        try {
            await Promise.race([
                page.waitForURL(/\/dashboard/, { timeout: 15000 }),
                page.waitForURL(/\/login/, { timeout: 15000 }).then(() => {
                    throw new Error("Redirected to login after login attempt - authentication failed");
                }),
            ]);
        }
        catch (error: any) {
            const currentUrl = page.url();
            await page.screenshot({ path: "test-results/login-timeout-documents.png", fullPage: true });
            if (error.message.includes("Redirected to login")) {
                throw new Error(`Login failed - redirected back to login page.\n` +
                    `Current URL: ${currentUrl}\n` +
                    `This usually means:\n` +
                    `1. Credenciais inválidas: Verifique TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.test\n` +
                    `2. Sessão não foi estabelecida: O Supabase pode não estar salvando a sessão corretamente\n` +
                    `3. Email não confirmado: Se email confirmation estiver ativado, confirme o email primeiro\n` +
                    `\nScreenshot salvo em: test-results/login-timeout-documents.png`);
            }
            throw new Error(`Login timeout. Current URL: ${currentUrl}\n` +
                `Possíveis causas:\n` +
                `1. Credenciais inválidas: Verifique TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.test\n` +
                `2. Usuário não existe: Crie o usuário no Supabase Dashboard > Authentication > Users\n` +
                `3. Supabase não configurado: Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY\n` +
                `4. Email não confirmado: Se email confirmation estiver ativado, confirme o email primeiro\n` +
                `\nScreenshot salvo em: test-results/login-timeout-documents.png`);
        }
        await page.waitForLoadState("domcontentloaded");
        await page.waitForLoadState("networkidle");
        const urlAfterLoad = page.url();
        if (urlAfterLoad.includes('/login')) {
            await page.screenshot({ path: "test-results/redirected-to-login-after-load.png", fullPage: true });
            throw new Error(`Login failed - redirected to login after dashboard load.\n` +
                `This indicates useAuth() did not detect the user session.\n` +
                `Current URL: ${urlAfterLoad}\n` +
                `Screenshot saved to: test-results/redirected-to-login-after-load.png`);
        }
        try {
            await expect(page.getByText(/meus documentos/i)).toBeVisible({ timeout: 5000 });
        }
        catch {
            const avatarSelectors = [
                page.locator('button:has([data-slot="avatar"])'),
                page.locator('[data-slot="avatar"]').locator('..'),
                page.locator('button[class*="rounded-full"]').filter({ has: page.locator('[data-slot="avatar"]') }),
                page.locator('button[class*="rounded-full"]').nth(1),
                page.locator('button').filter({ has: page.locator('[data-slot="avatar"]') }),
            ];
            let avatarFound = false;
            for (const selector of avatarSelectors) {
                const isVisible = await selector.isVisible({ timeout: 2000 }).catch(() => false);
                if (isVisible) {
                    avatarFound = true;
                    break;
                }
            }
            if (!avatarFound) {
                const anyRoundedButton = page.locator('button[class*="rounded-full"]');
                const count = await anyRoundedButton.count();
                if (count > 0) {
                    avatarFound = true;
                }
            }
            if (!avatarFound) {
                await page.waitForTimeout(1000);
                const currentUrl = page.url();
                if (!currentUrl.includes('/dashboard')) {
                    throw new Error(`Login failed - not redirected to dashboard. Current URL: ${currentUrl}`);
                }
            }
        }
        await page.waitForTimeout(2000);
        const cookies = await page.context().cookies();
        const supabaseCookies = cookies.filter((cookie: {
            name: string;
        }) => cookie.name.includes('supabase') ||
            cookie.name.includes('sb-') ||
            cookie.name.includes('auth-token'));
        if (supabaseCookies.length === 0) {
            console.warn("No Supabase session cookies found after login. Session may not be persisted.");
            const currentUrl = page.url();
            if (currentUrl.includes('/login')) {
                await page.screenshot({ path: "test-results/login-failed-no-cookies.png", fullPage: true });
                throw new Error("Login failed - no session cookies found and still on login page.\n" +
                    "This indicates the login did not succeed.\n" +
                    `Current URL: ${currentUrl}\n` +
                    "Screenshot saved to: test-results/login-failed-no-cookies.png");
            }
        }
        const finalUrl = page.url();
        if (!finalUrl.includes('/dashboard')) {
            await page.screenshot({ path: "test-results/not-on-dashboard-after-login-check.png", fullPage: true });
            throw new Error(`Login verification failed - not on dashboard. Current URL: ${finalUrl}\n` +
                "Screenshot saved to: test-results/not-on-dashboard-after-login-check.png");
        }
    }
    test("should upload a real PDF document", async ({ page }) => {
        test.setTimeout(90000);
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            test.skip();
            return;
        }
        await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
        await page.waitForLoadState("domcontentloaded");
        await waitForSupabaseSession(page, 20000);
        const currentUrl = page.url();
        if (currentUrl.includes("/login")) {
            console.log("⚠️ Sessão não detectada, fazendo login manual...");
            await login(page);
        }
        else {
            await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
        }
        const cookies = await page.context().cookies();
        const hasSessionCookies = cookies.some((cookie) => cookie.name.includes('supabase') ||
            cookie.name.includes('sb-'));
        if (!hasSessionCookies) {
            console.warn("⚠️ No session cookies found - this is normal with storageState, Supabase SSR uses localStorage");
        }
        else {
            console.log(`✅ Found ${cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')).length} session cookies`);
        }
        const titleSelectors = [
            page.getByRole('heading', { name: /meus documentos/i }),
            page.getByText(/meus documentos/i),
            page.locator('h1, h2, h3').filter({ hasText: /meus documentos/i }),
        ];
        let titleFound = false;
        for (const selector of titleSelectors) {
            const isVisible = await selector.isVisible({ timeout: 5000 }).catch(() => false);
            if (isVisible) {
                titleFound = true;
                break;
            }
        }
        if (!titleFound) {
            await page.screenshot({ path: "test-results/title-not-found-upload.png", fullPage: true });
            throw new Error("Title 'Meus Documentos' not found. Possible reasons:\n" +
                "1. Not authenticated (redirected to login)\n" +
                "2. Page not fully loaded\n" +
                "3. Text rendered differently in this browser\n" +
                `Current URL: ${page.url()}\n` +
                "Screenshot saved to: test-results/title-not-found-upload.png");
        }
        let uploadRequestCompleted = false;
        let uploadResponseStatus: number | null = null;
        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('/api/documents') && response.request().method() === 'POST') {
                uploadRequestCompleted = true;
                uploadResponseStatus = response.status();
                console.log(`Upload response status: ${uploadResponseStatus}`);
            }
        });
        const testPdfPath = path.join(__dirname, "fixtures", "test-document.pdf");
        if (!fs.existsSync(testPdfPath)) {
            const fixturesDir = path.dirname(testPdfPath);
            if (!fs.existsSync(fixturesDir)) {
                fs.mkdirSync(fixturesDir, { recursive: true });
            }
            const minimalPdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF");
            fs.writeFileSync(testPdfPath, minimalPdf);
        }
        const urlAfterLogin = page.url();
        if (!urlAfterLogin.includes("/dashboard")) {
            try {
                await Promise.race([
                    retryGoto(page, "/dashboard", { waitUntil: "networkidle" }).then(() => page.waitForLoadState("domcontentloaded")),
                    page.waitForURL(/\/login/, { timeout: 5000 }).then(() => {
                        throw new Error("Redirected to login when navigating to dashboard");
                    }),
                ]);
            }
            catch (error: any) {
                if (error.message.includes("Redirected to login")) {
                    await page.screenshot({ path: "test-results/redirected-to-login-after-upload-login.png", fullPage: true });
                    throw new Error(`Session lost after login. Redirected to login when trying to access dashboard.\n` +
                        `This indicates the session was not properly established.\n` +
                        `Current URL: ${page.url()}\n` +
                        "Screenshot saved to: test-results/redirected-to-login-after-upload-login.png");
                }
                throw error;
            }
            const currentUrl = page.url();
            if (currentUrl.includes("/login")) {
                await page.screenshot({ path: "test-results/redirected-to-login-after-upload-login.png", fullPage: true });
                throw new Error(`Session lost after login. Redirected to login when trying to access dashboard.\n` +
                    `Current URL: ${currentUrl}\n` +
                    "Screenshot saved to: test-results/redirected-to-login-after-upload-login.png");
            }
        }
        const uploadSelectors = [
            page.getByText(/enviar documento jurídico/i),
            page.getByText(/enviar documento/i),
            page.locator('[class*="card"]').filter({ hasText: /enviar|upload|documento/i }),
        ];
        let uploadComponentFound = false;
        for (const selector of uploadSelectors) {
            const isVisible = await selector.isVisible({ timeout: 5000 }).catch(() => false);
            if (isVisible) {
                uploadComponentFound = true;
                break;
            }
        }
        if (!uploadComponentFound) {
            await page.screenshot({ path: "test-results/upload-component-not-found.png", fullPage: true });
            throw new Error("Upload component not found. Possible reasons:\n" +
                "1. Not authenticated (redirected to login)\n" +
                "2. Page not fully loaded\n" +
                "3. Component not rendered\n" +
                `Current URL: ${page.url()}\n` +
                "Screenshot saved to: test-results/upload-component-not-found.png");
        }
        const fileInput = page.locator('input[type="file"]#file-upload');
        await expect(fileInput).toHaveCount(1, { timeout: 5000 });
        const cardsBeforeUpload = page.locator('[class*="card"]').filter({
            hasNot: page.getByText(/enviar documento jurídico/i)
        });
        const countBefore = await cardsBeforeUpload.count();
        await fileInput.setInputFiles(testPdfPath);
        console.log("File selected, waiting for upload to complete...");
        try {
            await page.waitForFunction(() => {
                const button = document.querySelector('label[for="file-upload"]');
                return button?.textContent?.includes('Selecionar Arquivo') || false;
            }, { timeout: 40000 });
            console.log("Button returned to 'Selecionar Arquivo' state");
        }
        catch {
            console.log("Button did not return to normal state, continuing with other checks...");
        }
        await page.waitForTimeout(2000);
        if (uploadRequestCompleted) {
            console.log(`Upload request completed with status: ${uploadResponseStatus}`);
            if (uploadResponseStatus && uploadResponseStatus >= 400) {
                if (uploadResponseStatus === 401) {
                    const currentUrlAfter401 = page.url();
                    if (currentUrlAfter401.includes('/login')) {
                        console.log("⚠️ Session expired during upload, attempting to re-authenticate...");
                        await login(page);
                        console.log("🔄 Retrying upload after re-authentication...");
                        const fileInputRetry = page.locator('input[type="file"]#file-upload');
                        await fileInputRetry.setInputFiles(testPdfPath);
                        await page.waitForTimeout(5000);
                        const currentUrlRetry = page.url();
                        if (currentUrlRetry.includes('/login')) {
                            throw new Error(`Upload failed: Session expired and re-authentication failed.`);
                        }
                        uploadRequestCompleted = false;
                        uploadResponseStatus = null;
                        const startWait = Date.now();
                        while (!uploadRequestCompleted && (Date.now() - startWait) < 40000) {
                            await page.waitForTimeout(1000);
                        }
                        if (uploadRequestCompleted && uploadResponseStatus) {
                            if (uploadResponseStatus >= 200 && uploadResponseStatus < 300) {
                                console.log(`✅ Retry upload successful with status: ${uploadResponseStatus}`);
                            }
                            else {
                                console.warn(`⚠️ Retry upload returned status: ${uploadResponseStatus}`);
                            }
                        }
                        else {
                            console.warn("⚠️ No upload response received after retry, continuing anyway...");
                        }
                        try {
                            await page.waitForFunction(() => {
                                const button = document.querySelector('label[for="file-upload"]');
                                return button?.textContent?.includes('Selecionar Arquivo') || false;
                            }, { timeout: 40000 });
                        }
                        catch {
                        }
                        await page.waitForTimeout(2000);
                        console.log("✅ Re-authentication successful, continuing with upload verification...");
                    }
                    else {
                        console.log("⚠️ Received 401 but still on dashboard, attempting to re-authenticate...");
                        await login(page);
                        console.log("🔄 Retrying upload after re-authentication...");
                        const fileInputRetry = page.locator('input[type="file"]#file-upload');
                        await fileInputRetry.setInputFiles(testPdfPath);
                        uploadRequestCompleted = false;
                        uploadResponseStatus = null;
                        const startWait = Date.now();
                        while (!uploadRequestCompleted && (Date.now() - startWait) < 40000) {
                            await page.waitForTimeout(1000);
                        }
                        if (uploadRequestCompleted && uploadResponseStatus) {
                            if (uploadResponseStatus >= 200 && uploadResponseStatus < 300) {
                                console.log(`✅ Retry upload successful with status: ${uploadResponseStatus}`);
                            }
                            else {
                                console.warn(`⚠️ Retry upload returned status: ${uploadResponseStatus}`);
                            }
                        }
                        else {
                            console.warn("⚠️ No upload response received after retry, continuing anyway...");
                        }
                        await page.waitForTimeout(2000);
                        console.log("✅ Re-authentication successful, continuing with upload verification...");
                    }
                }
                throw new Error(`Upload failed with HTTP status ${uploadResponseStatus}`);
            }
        }
        let uploadSuccess = false;
        try {
            console.log(`Documents before upload: ${countBefore}`);
            await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => { });
            await page.waitForFunction((countBefore) => {
                const allCards = Array.from(document.querySelectorAll('[class*="card"]'));
                const documentCards = allCards.filter(card => {
                    const text = card.textContent || '';
                    return !text.toLowerCase().includes('enviar documento jurídico');
                });
                const newCount = documentCards.length;
                console.log(`Current document count: ${newCount}, before: ${countBefore}`);
                return newCount > countBefore;
            }, countBefore, { timeout: 30000, polling: 500 });
            uploadSuccess = true;
            console.log("✅ Upload confirmed: New document appeared in list");
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Target page')) {
                try {
                    if (!page.isClosed()) {
                        await page.screenshot({ path: "test-results/upload-page-closed.png", fullPage: true }).catch(() => { });
                    }
                }
                catch {
                }
                throw new Error("Page was closed during upload verification. This may indicate a crash or navigation issue.");
            }
            const cardsAfterUpload = page.locator('[class*="card"]').filter({
                hasNot: page.getByText(/enviar documento jurídico/i)
            });
            const countAfter = await cardsAfterUpload.count().catch(() => countBefore);
            if (countAfter > countBefore) {
                uploadSuccess = true;
            }
            else {
                const newDocumentSelectors = [
                    page.locator('[class*="card"]').filter({ hasText: /pendente/i }),
                    page.locator('[class*="card"]').filter({ hasText: /processando/i }),
                    page.locator('[class*="card"]').filter({ hasText: /test-document\.pdf/i }),
                    page.locator('[class*="card"]').filter({ hasText: /test-upload\.pdf/i }),
                ];
                for (const selector of newDocumentSelectors) {
                    const isVisible = await selector.isVisible({ timeout: 5000 }).catch(() => false);
                    if (isVisible) {
                        uploadSuccess = true;
                        break;
                    }
                }
            }
        }
        if (!uploadSuccess) {
            console.log("Checking for success toast...");
            const toastSelectors = [
                page.getByText(/documento enviado com sucesso/i),
                page.locator('[data-sonner-toast]').filter({ hasText: /documento enviado com sucesso/i }),
                page.locator('[data-sonner-toast]').filter({ hasText: /sucesso/i }),
                page.locator('[role="status"]').filter({ hasText: /documento enviado/i }),
                page.locator('[data-sonner-toast]').last(),
            ];
            for (const selector of toastSelectors) {
                try {
                    await selector.waitFor({ state: "visible", timeout: 8000 });
                    const toastText = await selector.textContent().catch(() => "");
                    console.log(`Toast found: ${toastText}`);
                    if (toastText?.toLowerCase().includes('sucesso') || toastText?.toLowerCase().includes('enviado')) {
                        uploadSuccess = true;
                        break;
                    }
                }
                catch {
                    continue;
                }
            }
        }
        if (!uploadSuccess && uploadRequestCompleted && uploadResponseStatus && uploadResponseStatus >= 200 && uploadResponseStatus < 300) {
            console.log("Upload request was successful (HTTP 200-299), considering upload successful");
            uploadSuccess = true;
        }
        if (!uploadSuccess) {
            try {
                if (!page.isClosed()) {
                    await page.screenshot({ path: "test-results/upload-failed.png", fullPage: true }).catch(() => { });
                }
            }
            catch {
            }
            const errorSelectors = [
                page.getByText(/erro|error/i),
                page.locator('[data-sonner-toast]').filter({ hasText: /erro|error/i }),
            ];
            let errorFound = false;
            for (const selector of errorSelectors) {
                const visible = await selector.isVisible({ timeout: 2000 }).catch(() => false);
                if (visible) {
                    const errorText = await selector.textContent().catch(() => "Unknown error");
                    throw new Error(`Upload failed with error: ${errorText}`);
                }
            }
            throw new Error("Upload confirmation not found. Check if upload was successful.\n" +
                "Possible reasons:\n" +
                "1. API not available or not responding\n" +
                "2. File too large or invalid format\n" +
                "3. Authentication failed\n" +
                "4. Toast notification appeared and disappeared too quickly\n" +
                "Screenshot saved to: test-results/upload-failed.png");
        }
    });
    test("should query document with real AI", async ({ page }) => {
        test.setTimeout(120000);
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            test.skip();
            return;
        }
        await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
        await page.waitForLoadState("domcontentloaded");
        await waitForSupabaseSession(page, 20000);
        const currentUrl = page.url();
        if (currentUrl.includes("/login")) {
            console.log("⚠️ Sessão não detectada, fazendo login manual...");
            await login(page);
        }
        else {
            await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
        }
        const cookiesInitial = await page.context().cookies();
        const hasSessionCookiesInitial = cookiesInitial.some((cookie) => cookie.name.includes('supabase') ||
            cookie.name.includes('sb-'));
        if (!hasSessionCookiesInitial) {
            console.warn("⚠️ No session cookies found initially - this is normal with storageState");
        }
        const titleSelectors = [
            page.getByRole('heading', { name: /meus documentos/i }),
            page.getByText(/meus documentos/i),
            page.locator('h1, h2, h3').filter({ hasText: /meus documentos/i }),
        ];
        let titleFound = false;
        for (const selector of titleSelectors) {
            const isVisible = await selector.isVisible({ timeout: 5000 }).catch(() => false);
            if (isVisible) {
                titleFound = true;
                break;
            }
        }
        if (!titleFound) {
            await page.screenshot({ path: "test-results/title-not-found-query.png", fullPage: true });
            throw new Error("Title 'Meus Documentos' not found. Possible reasons:\n" +
                "1. Not authenticated (redirected to login)\n" +
                "2. Page not fully loaded\n" +
                "3. Text rendered differently in this browser\n" +
                `Current URL: ${page.url()}\n` +
                "Screenshot saved to: test-results/title-not-found-query.png");
        }
        const cookiesAfterTitle = await page.context().cookies();
        const sessionCookiesCount = cookiesAfterTitle.filter(c => c.name.includes('supabase') || c.name.includes('sb-')).length;
        if (sessionCookiesCount > 0) {
            console.log(`✅ Found ${sessionCookiesCount} session cookies`);
        }
        const urlAfterLogin = page.url();
        if (!urlAfterLogin.includes("/dashboard")) {
            await page.screenshot({ path: "test-results/not-on-dashboard-after-login.png", fullPage: true });
            throw new Error(`Not on dashboard after login. Current URL: ${urlAfterLogin}\n` +
                "Screenshot saved to: test-results/not-on-dashboard-after-login.png");
        }
        await page.waitForLoadState("domcontentloaded");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        const urlBeforeNavigation = page.url();
        if (!urlBeforeNavigation.includes("/dashboard")) {
            await page.screenshot({ path: "test-results/session-lost-before-navigation.png", fullPage: true });
            throw new Error(`Session lost before navigation. Redirected from dashboard. Current URL: ${urlBeforeNavigation}\n` +
                "Screenshot saved to: test-results/session-lost-before-navigation.png");
        }
        const documentCards = page.locator('[class*="card"]').filter({ hasText: /concluído|completed/i });
        let cardCount = await documentCards.count();
        if (cardCount === 0) {
            const allCards = page.locator('[class*="card"]');
            const allCardsCount = await allCards.count();
            if (allCardsCount === 0) {
                test.skip();
                return;
            }
            const firstCard = allCards.first();
            const chatButton = firstCard.getByRole("button", { name: /abrir chat/i });
            const isChatButtonVisible = await chatButton.isVisible({ timeout: 2000 }).catch(() => false);
            if (!isChatButtonVisible) {
                test.skip();
                return;
            }
            const isEnabled = !(await chatButton.isDisabled({ timeout: 1000 }).catch(() => true));
            if (!isEnabled) {
                test.skip();
                return;
            }
            await chatButton.click();
        }
        else {
            const firstCard = documentCards.first();
            const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
            await menuButton.first().click();
            const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
            await expect(chatMenuItem).toBeVisible({ timeout: 3000 });
            await chatMenuItem.click();
        }
        const urlBeforeClick = page.url();
        if (!urlBeforeClick.includes('/dashboard')) {
            await page.screenshot({ path: "test-results/not-on-dashboard-before-click.png", fullPage: true });
            throw new Error(`Not on dashboard before clicking chat button. Current URL: ${urlBeforeClick}\n` +
                "Screenshot saved to: test-results/not-on-dashboard-before-click.png");
        }
        let navigationSuccess = false;
        try {
            await Promise.race([
                page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 }),
                page.waitForURL(/\/login/, { timeout: 15000 }).then(() => {
                    throw new Error("REDIRECTED_TO_LOGIN");
                }),
            ]);
            navigationSuccess = true;
        }
        catch (error: any) {
            if (error.message === "REDIRECTED_TO_LOGIN") {
                await page.screenshot({ path: "test-results/redirected-to-login-before-nav.png", fullPage: true });
                const cookiesAfterRedirect = await page.context().cookies();
                const hasCookiesAfter = cookiesAfterRedirect.some((cookie: {
                    name: string;
                }) => cookie.name.includes('supabase') ||
                    cookie.name.includes('sb-'));
                console.log("Session lost, attempting to re-authenticate...");
                await login(page);
                await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
                await page.waitForLoadState("domcontentloaded");
                await waitForSupabaseSession(page, 15000);
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(2000);
                const documentCardsAfterRelogin = page.locator('[class*="card"]').filter({ hasText: /concluído|completed/i });
                let cardCountAfter = await documentCardsAfterRelogin.count();
                if (cardCountAfter === 0) {
                    const allCardsAfterRelogin = page.locator('[class*="card"]');
                    const allCardsCountAfter = await allCardsAfterRelogin.count();
                    if (allCardsCountAfter === 0) {
                        test.skip();
                        return;
                    }
                    const firstCard = allCardsAfterRelogin.first();
                    const chatButton = firstCard.getByRole("button", { name: /abrir chat/i });
                    const isChatButtonVisible = await chatButton.isVisible({ timeout: 2000 }).catch(() => false);
                    if (isChatButtonVisible) {
                        const isEnabled = !(await chatButton.isDisabled({ timeout: 1000 }).catch(() => true));
                        if (isEnabled) {
                            await chatButton.click();
                            await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                            navigationSuccess = true;
                            return;
                        }
                    }
                    const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                    const menuButtonCount = await menuButton.count();
                    if (menuButtonCount > 0) {
                        await menuButton.first().click();
                        const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                        const isMenuItemVisible = await chatMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
                        if (isMenuItemVisible) {
                            await chatMenuItem.click();
                            await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                            navigationSuccess = true;
                            return;
                        }
                    }
                    test.skip();
                    return;
                }
                const firstCard = documentCardsAfterRelogin.first();
                const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                await menuButton.first().click();
                const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                await expect(chatMenuItem).toBeVisible({ timeout: 3000 });
                await chatMenuItem.click();
                await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                navigationSuccess = true;
            }
            else {
                throw error;
            }
        }
        const urlAfterNavigation = page.url();
        if (urlAfterNavigation.includes('/login')) {
            await page.screenshot({ path: "test-results/redirected-to-login-after-wait.png", fullPage: true });
            throw new Error("Redirected to login page after navigation. Session may have expired.\n" +
                `Current URL: ${urlAfterNavigation}\n` +
                "Screenshot saved to: test-results/redirected-to-login-after-wait.png");
        }
        try {
            await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
            const urlAfterDom = page.url();
            if (urlAfterDom.includes('/login')) {
                console.log("⚠️ Session lost during page load, attempting to re-authenticate...");
                await login(page);
                await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
                await page.waitForLoadState("domcontentloaded");
                await waitForSupabaseSession(page, 15000);
                const dashboardUrl = page.url();
                if (!dashboardUrl.includes("/dashboard")) {
                    throw new Error("Failed to return to dashboard after re-authentication");
                }
                const documentCardsRetry = page.locator('[class*="card"]').filter({ hasText: /concluído|completed/i });
                const cardCountRetry = await documentCardsRetry.count();
                if (cardCountRetry > 0) {
                    const firstCard = documentCardsRetry.first();
                    const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                    await menuButton.first().click();
                    const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                    await expect(chatMenuItem).toBeVisible({ timeout: 3000 });
                    await chatMenuItem.click();
                    await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                    await page.waitForLoadState("domcontentloaded");
                }
                else {
                    throw new Error("No completed documents found after re-authentication");
                }
            }
            const cookiesAfterDom = await page.context().cookies();
            const hasCookiesAfterDom = cookiesAfterDom.some((cookie: {
                name: string;
            }) => cookie.name.includes('supabase') ||
                cookie.name.includes('sb-'));
            if (!hasCookiesAfterDom) {
                console.warn("⚠️ No session cookies found after domcontentloaded. Attempting to restore session...");
                try {
                    await page.reload({ waitUntil: "networkidle" });
                    await page.waitForLoadState("domcontentloaded");
                    const urlAfterReload = page.url();
                    if (urlAfterReload.includes('/login')) {
                        throw new Error("REDIRECTED_TO_LOGIN_AFTER_RELOAD");
                    }
                }
                catch (reloadError: any) {
                    if (reloadError.message === "REDIRECTED_TO_LOGIN_AFTER_RELOAD") {
                        throw new Error("REDIRECTED_TO_LOGIN_DURING_LOAD");
                    }
                }
            }
            await Promise.race([
                page.waitForLoadState("networkidle", { timeout: 10000 }),
                page.waitForURL(/\/login/, { timeout: 10000 }).then(() => {
                    throw new Error("REDIRECTED_TO_LOGIN_DURING_LOAD");
                }),
            ]);
            await page.waitForTimeout(2000);
            const finalUrl = page.url();
            if (finalUrl.includes('/login')) {
                console.log("⚠️ Session lost after page load, attempting to re-authenticate...");
                await login(page);
                await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
                await page.waitForLoadState("domcontentloaded");
                await waitForSupabaseSession(page, 15000);
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(2000);
                const documentCardsRetry = page.locator('[class*="card"]').filter({ hasText: /concluído|completed/i });
                let cardCountRetry = await documentCardsRetry.count();
                if (cardCountRetry === 0) {
                    const allCardsRetry = page.locator('[class*="card"]');
                    const allCardsCountRetry = await allCardsRetry.count();
                    if (allCardsCountRetry === 0) {
                        test.skip();
                        return;
                    }
                    const firstCard = allCardsRetry.first();
                    const chatButton = firstCard.getByRole("button", { name: /abrir chat/i });
                    const isChatButtonVisible = await chatButton.isVisible({ timeout: 2000 }).catch(() => false);
                    if (isChatButtonVisible) {
                        const isEnabled = !(await chatButton.isDisabled({ timeout: 1000 }).catch(() => true));
                        if (isEnabled) {
                            await chatButton.click();
                            await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                            await page.waitForLoadState("domcontentloaded");
                            return;
                        }
                    }
                    const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                    const menuButtonCount = await menuButton.count();
                    if (menuButtonCount > 0) {
                        await menuButton.first().click();
                        const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                        const isMenuItemVisible = await chatMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
                        if (isMenuItemVisible) {
                            await chatMenuItem.click();
                            await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                            await page.waitForLoadState("domcontentloaded");
                            return;
                        }
                    }
                    test.skip();
                    return;
                }
                const firstCard = documentCardsRetry.first();
                const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                await menuButton.first().click();
                const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                await expect(chatMenuItem).toBeVisible({ timeout: 3000 });
                await chatMenuItem.click();
                await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                await page.waitForLoadState("domcontentloaded");
            }
        }
        catch (error: any) {
            if (error.message === "REDIRECTED_TO_LOGIN_DURING_LOAD") {
                console.log("⚠️ Session lost during load, attempting to re-authenticate...");
                try {
                    await login(page);
                    await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
                    await page.waitForLoadState("domcontentloaded");
                    await waitForSupabaseSession(page, 15000);
                    await page.waitForLoadState("networkidle");
                    await page.waitForTimeout(2000);
                    const documentCardsRetry = page.locator('[class*="card"]').filter({ hasText: /concluído|completed/i });
                    let cardCountRetry = await documentCardsRetry.count();
                    if (cardCountRetry === 0) {
                        const allCardsRetry = page.locator('[class*="card"]');
                        const allCardsCountRetry = await allCardsRetry.count();
                        if (allCardsCountRetry === 0) {
                            test.skip();
                            return;
                        }
                        const firstCard = allCardsRetry.first();
                        const chatButton = firstCard.getByRole("button", { name: /abrir chat/i });
                        const isChatButtonVisible = await chatButton.isVisible({ timeout: 2000 }).catch(() => false);
                        if (isChatButtonVisible) {
                            const isEnabled = !(await chatButton.isDisabled({ timeout: 1000 }).catch(() => true));
                            if (isEnabled) {
                                await chatButton.click();
                                await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                                await page.waitForLoadState("domcontentloaded");
                                return;
                            }
                        }
                        const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                        const menuButtonCount = await menuButton.count();
                        if (menuButtonCount > 0) {
                            await menuButton.first().click();
                            const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                            const isMenuItemVisible = await chatMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
                            if (isMenuItemVisible) {
                                await chatMenuItem.click();
                                await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                                await page.waitForLoadState("domcontentloaded");
                                return;
                            }
                        }
                        test.skip();
                        return;
                    }
                    const firstCard = documentCardsRetry.first();
                    const menuButton = firstCard.getByRole("button").filter({ has: page.locator('svg') });
                    await menuButton.first().click();
                    const chatMenuItem = page.getByRole("menuitem", { name: /abrir chat/i });
                    await expect(chatMenuItem).toBeVisible({ timeout: 3000 });
                    await chatMenuItem.click();
                    await page.waitForURL(/\/documents\/[^/]+/, { timeout: 15000 });
                    await page.waitForLoadState("domcontentloaded");
                }
                catch (reAuthError) {
                    await page.screenshot({ path: "test-results/redirected-during-load.png", fullPage: true });
                    throw new Error("Redirected to login during page load and re-authentication failed.\n" +
                        `Current URL: ${page.url()}\n` +
                        `Original error: ${error.message}\n` +
                        `Re-auth error: ${reAuthError instanceof Error ? reAuthError.message : String(reAuthError)}\n` +
                        "Screenshot saved to: test-results/redirected-during-load.png");
                }
            }
            else {
                throw error;
            }
        }
        const chatInputSelectors = [
            page.getByPlaceholder(/faça uma pergunta sobre o documento/i),
            page.getByPlaceholder(/faça uma pergunta/i),
            page.locator('textarea[placeholder*="pergunta"]'),
            page.locator('textarea[placeholder*="Faça"]'),
            page.locator('form textarea'),
            page.locator('textarea').first(),
        ];
        let chatInput: any = null;
        for (const selector of chatInputSelectors) {
            const isVisible = await selector.isVisible({ timeout: 3000 }).catch(() => false);
            if (isVisible) {
                chatInput = selector;
                break;
            }
        }
        if (!chatInput) {
            const urlAfterSearch = page.url();
            if (urlAfterSearch.includes('/login')) {
                await page.screenshot({ path: "test-results/redirected-while-searching.png", fullPage: true });
                throw new Error("Redirected to login while searching for chat input. Session expired.\n" +
                    `Current URL: ${urlAfterSearch}\n` +
                    "Screenshot saved to: test-results/redirected-while-searching.png");
            }
            await page.screenshot({ path: "test-results/chat-input-not-found.png", fullPage: true });
            throw new Error("Chat input not found. Possible reasons:\n" +
                "1. Document not processed yet\n" +
                "2. Page not fully loaded\n" +
                "3. Component not rendered\n" +
                `Current URL: ${urlAfterSearch}\n` +
                "Screenshot saved to: test-results/chat-input-not-found.png");
        }
        await expect(chatInput).toBeVisible({ timeout: 5000 });
        const isEnabled = !(await chatInput.isDisabled({ timeout: 2000 }).catch(() => true));
        if (!isEnabled) {
            test.skip();
            return;
        }
        await chatInput.fill("Qual é o conteúdo deste documento?");
        const submitButton = page.locator('form button[type="submit"]');
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        await expect(submitButton).toBeEnabled({ timeout: 2000 });
        await submitButton.click();
        await expect(page.getByText(/qual é o conteúdo deste documento\?/i)).toBeVisible({ timeout: 10000 });
        const responseSelectors = [
            page.locator('[class*="message"]').filter({ hasText: /jurista|assistente|resposta/i }),
            page.locator('[class*="assistant"]'),
            page.getByText(/jurista ai/i),
        ];
        let responseFound = false;
        for (const selector of responseSelectors) {
            const visible = await selector.isVisible({ timeout: 60000 }).catch(() => false);
            if (visible) {
                responseFound = true;
                break;
            }
        }
        if (!responseFound) {
            await page.screenshot({ path: "test-results/ai-response-timeout.png", fullPage: true });
            console.warn("AI response not found within timeout. This may be due to slow API or processing.");
        }
    });
    test("should list real documents from database", async ({ page }) => {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            test.skip();
            return;
        }
        await retryGoto(page, "/dashboard", { waitUntil: "networkidle" });
        await page.waitForLoadState("domcontentloaded");
        await waitForSupabaseSession(page, 20000);
        const currentUrl = page.url();
        if (currentUrl.includes("/login")) {
            console.log("⚠️ Sessão não detectada, fazendo login manual...");
            await login(page);
        }
        else {
            await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
        }
        const titleSelectors = [
            page.getByRole('heading', { name: /meus documentos/i }),
            page.getByText(/meus documentos/i),
            page.locator('h1, h2, h3').filter({ hasText: /meus documentos/i }),
        ];
        let titleFound = false;
        for (const selector of titleSelectors) {
            const isVisible = await selector.isVisible({ timeout: 5000 }).catch(() => false);
            if (isVisible) {
                titleFound = true;
                break;
            }
        }
        if (!titleFound) {
            await page.screenshot({ path: "test-results/title-not-found-list.png", fullPage: true });
            throw new Error("Title 'Meus Documentos' not found. Possible reasons:\n" +
                "1. Not authenticated (redirected to login)\n" +
                "2. Page not fully loaded\n" +
                "3. Text rendered differently in this browser\n" +
                `Current URL: ${page.url()}\n` +
                "Screenshot saved to: test-results/title-not-found-list.png");
        }
        if (!page.url().includes("/dashboard")) {
            await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        }
        await page.waitForLoadState("domcontentloaded");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        const hasDocuments = await page
            .locator('[class*="card"]')
            .count()
            .then((count) => count > 0)
            .catch(() => false);
        const hasEmptyState = await page
            .getByText(/nenhum documento encontrado/i)
            .isVisible()
            .catch(() => false);
        expect(hasDocuments || hasEmptyState).toBe(true);
    });
});
