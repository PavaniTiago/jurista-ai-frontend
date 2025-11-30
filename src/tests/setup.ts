import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
afterEach(() => {
    cleanup();
});
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if ((errorMessage.includes('400') || errorMessage.includes('Bad Request')) &&
        (errorMessage.includes('/api/documents') || errorMessage.includes('POST'))) {
        return;
    }
    originalConsoleError(...args);
};
console.warn = (...args: any[]) => {
    const warnMessage = args.join(' ');
    if ((warnMessage.includes('400') || warnMessage.includes('Bad Request')) &&
        (warnMessage.includes('/api/documents') || warnMessage.includes('POST'))) {
        return;
    }
    originalConsoleWarn(...args);
};
if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
        try {
            const response = await originalFetch(...args);
            if (!response.ok && response.status === 400) {
                const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
                if (url.includes('/api/documents')) {
                    return response;
                }
            }
            return response;
        }
        catch (error) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
            if (url.includes('/api/documents')) {
                throw error;
            }
            throw error;
        }
    };
}
vi.mock("next/navigation", () => {
    const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    };
    return {
        useRouter: () => mockRouter,
        usePathname: () => "/",
        useSearchParams: () => new URLSearchParams(),
        useParams: () => ({}),
    };
});
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
if (!globalThis.crypto?.randomUUID) {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
        value: {
            ...originalCrypto,
            randomUUID: () => Math.random().toString(36).substring(7),
        },
        writable: true,
        configurable: true,
    });
}
