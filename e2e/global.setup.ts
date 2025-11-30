import { chromium, FullConfig } from "@playwright/test";
import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env.test") });
const authFile = path.join(__dirname, "..", "playwright", ".auth", "user.json");
async function waitForServer(page: any, baseURL: string, timeout: number = 60000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: 5000 });
            console.log(`   - Servidor está pronto (${Date.now() - startTime}ms)`);
            return;
        }
        catch (error) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error(`Servidor não está disponível em ${baseURL} após ${timeout}ms`);
}
async function globalSetup(config: FullConfig) {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;
    const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
    if (!testEmail || !testPassword) {
        console.warn("⚠️ Variáveis de ambiente não configuradas. Pulando setup de autenticação.");
        return;
    }
    console.log("🔐 Iniciando autenticação via browser Playwright...");
    try {
        const authDir = path.dirname(authFile);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        console.log(`   - Aguardando servidor estar pronto em ${baseURL}...`);
        await waitForServer(page, baseURL);
        console.log(`   - Navegando para ${baseURL}/login`);
        await page.goto(`${baseURL}/login`, { waitUntil: "networkidle", timeout: 30000 });
        console.log(`   - Preenchendo credenciais...`);
        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/senha/i).fill(testPassword);
        console.log(`   - Clicando no botão de login...`);
        await page.getByRole("button", { name: /entrar/i }).click();
        console.log(`   - Aguardando autenticação...`);
        await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
        await page.waitForLoadState("networkidle");
        const currentUrl = page.url();
        if (!currentUrl.includes("/dashboard")) {
            throw new Error(`Login falhou - redirecionado para: ${currentUrl}`);
        }
        console.log("✅ Login realizado com sucesso!");
        await context.storageState({ path: authFile });
        console.log(`✅ Estado de autenticação salvo em: ${authFile}`);
        console.log(`   - User: ${testEmail}`);
        await browser.close();
        console.log("✅ Setup de autenticação concluído com sucesso!");
    }
    catch (error: any) {
        console.error("❌ Erro no setup de autenticação:", error);
        console.error("   - Certifique-se de que:");
        console.error("     1. O servidor Next.js está rodando");
        console.error("     2. TEST_USER_EMAIL e TEST_USER_PASSWORD estão corretos no .env.test");
        console.error("     3. O usuário existe no Supabase");
        throw error;
    }
}
export default globalSetup;
