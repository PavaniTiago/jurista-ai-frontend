import { Page, expect } from "@playwright/test";
export async function waitForSupabaseSession(page: Page, timeout: number = 20000) {
    const startTime = Date.now();
    try {
        await page.waitForFunction(() => {
            const bodyText = document.body.textContent || '';
            const currentUrl = window.location.href;
            if (currentUrl.includes('/login') && !bodyText.includes('Carregando')) {
                return true;
            }
            if (bodyText.includes('Meus Documentos') || bodyText.includes('Dashboard')) {
                return true;
            }
            if (!bodyText.includes('Carregando') && bodyText.length > 100) {
                return true;
            }
            return false;
        }, { timeout, polling: 500 });
        await page.waitForTimeout(1000);
        const finalUrl = page.url();
        const elapsed = Date.now() - startTime;
        if (finalUrl.includes('/login')) {
            console.warn(`⚠️ Redirected to /login after ${elapsed}ms - session may not be valid`);
        }
        else if (finalUrl.includes('/dashboard')) {
            console.log(`✅ Session processed successfully in ${elapsed}ms - on dashboard`);
        }
    }
    catch (error: any) {
        const currentUrl = page.url();
        const elapsed = Date.now() - startTime;
        if (currentUrl.includes('/login')) {
            console.warn(`⚠️ Session check timeout after ${elapsed}ms - redirected to login`);
        }
        else {
            console.warn(`⚠️ Session check timeout after ${elapsed}ms - current URL: ${currentUrl}`);
        }
    }
}
export async function retryGoto(page: Page, url: string, options?: Parameters<Page['goto']>[1], retries: number = 5, delay: number = 2000) {
    for (let i = 0; i <= retries; i++) {
        try {
            if (i > 0) {
                console.log(`🔄 Retry ${i}/${retries} to navigate to ${url}`);
                await page.waitForTimeout(delay);
            }
            await page.goto(url, {
                ...options,
                timeout: 30000,
            });
            const currentUrl = page.url();
            if (currentUrl.includes('chrome-error://') || currentUrl.includes('about:error')) {
                throw new Error(`Navigation resulted in error page: ${currentUrl}`);
            }
            await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
            console.log(`✅ Successfully navigated to ${url}`);
            return;
        }
        catch (error: any) {
            const errorMessage = error.message || String(error);
            const isConnectionError = errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                errorMessage.includes('NS_ERROR_CONNECTION_REFUSED') ||
                errorMessage.includes('net::ERR_CONNECTION_REFUSED') ||
                errorMessage.includes('Timeout') ||
                errorMessage.includes('chrome-error://') ||
                errorMessage.includes('about:error');
            if (isConnectionError) {
                console.warn(`⚠️ Navigation to ${url} failed with connection/timeout error: ${errorMessage}`);
                if (i < retries) {
                    continue;
                }
                else {
                    console.error(`❌ Failed to navigate to ${url} after ${retries + 1} attempts.`);
                    throw new Error(`Failed to navigate to ${url} after ${retries + 1} attempts. ` +
                        `Last error: ${errorMessage}. ` +
                        `The server may not be ready or there may be a network issue.`);
                }
            }
            else {
                console.error(`❌ Unexpected error during navigation to ${url}: ${errorMessage}`);
                throw error;
            }
        }
    }
}
