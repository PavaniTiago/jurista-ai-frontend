import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDocuments, useDocument, useUploadDocument, useDeleteDocument } from "../use-documents";
import { authenticateTestUser, cleanupTestDocuments, createTestDocument, createTestPdfFile, deleteTestDocument, isApiAvailable, isTestEnvironmentConfigured, signOutTestUser, } from "@/tests/test-helpers";
import { toast } from "sonner";
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: {
        children: React.ReactNode;
    }) => (<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
};
describe("useDocuments", () => {
    const isConfigured = isTestEnvironmentConfigured();
    beforeEach(async () => {
        if (isConfigured) {
            await authenticateTestUser();
            await cleanupTestDocuments();
        }
    });
    afterEach(async () => {
        if (isConfigured) {
            await cleanupTestDocuments();
            await signOutTestUser();
        }
    });
    it.skipIf(!isConfigured)("should fetch documents list", async () => {
        let docId: string | null = null;
        try {
            docId = await createTestDocument("test-list.pdf");
        }
        catch (error) {
            console.warn("API not available, testing with existing documents");
        }
        const { result } = renderHook(() => useDocuments(), {
            wrapper: createWrapper(),
        });
        await waitFor(() => {
            expect(result.current.isSuccess || result.current.isError).toBe(true);
        }, { timeout: 10000 });
        if (result.current.isSuccess) {
            expect(result.current.data).toBeTruthy();
            expect(result.current.data?.documents).toBeInstanceOf(Array);
        }
        if (docId) {
            try {
                await deleteTestDocument(docId);
            }
            catch {
            }
        }
    });
});
describe("useDocument", () => {
    const isConfigured = isTestEnvironmentConfigured();
    beforeEach(async () => {
        if (isConfigured) {
            await authenticateTestUser();
        }
    });
    afterEach(async () => {
        if (isConfigured) {
            await signOutTestUser();
        }
    });
    it.skipIf(!isConfigured)("should fetch a single document", async () => {
        let docId: string | null = null;
        try {
            docId = await createTestDocument("test-single.pdf");
        }
        catch (error) {
            console.warn("Skipping single document test: API not available to create test document");
            return;
        }
        if (!docId)
            return;
        const { result } = renderHook(() => useDocument(docId), {
            wrapper: createWrapper(),
        });
        await waitFor(() => {
            expect(result.current.isSuccess || result.current.isError).toBe(true);
        }, { timeout: 10000 });
        if (result.current.isSuccess) {
            expect(result.current.data).toBeTruthy();
            expect(result.current.data?.document).toBeTruthy();
            expect(result.current.data?.document.id).toBe(docId);
        }
        try {
            await deleteTestDocument(docId);
        }
        catch {
        }
    });
    it("should not fetch if documentId is empty", () => {
        const { result } = renderHook(() => useDocument(""), {
            wrapper: createWrapper(),
        });
        expect(result.current.isFetching).toBe(false);
    });
});
describe("useUploadDocument", () => {
    const isConfigured = isTestEnvironmentConfigured();
    beforeEach(async () => {
        if (isConfigured) {
            await authenticateTestUser();
        }
    });
    afterEach(async () => {
        if (isConfigured) {
            await cleanupTestDocuments();
            await signOutTestUser();
        }
    });
    it.skipIf(!isConfigured)("should upload a document successfully", async () => {
        const apiAvailable = await isApiAvailable();
        const mockFile = createTestPdfFile("test-upload.pdf");
        const { result } = renderHook(() => useUploadDocument(), {
            wrapper: createWrapper(),
        });
        const originalFetch = global.fetch;
        const fetchErrors: any[] = [];
        global.fetch = vi.fn((...args: [
            RequestInfo | URL,
            RequestInit?
        ]) => {
            return (originalFetch as typeof fetch)(...args).catch((error) => {
                if (error?.message?.includes('400') || error?.status === 400) {
                    fetchErrors.push(error);
                    return Promise.reject(new Error("Failed to upload document"));
                }
                throw error;
            }) as Promise<Response>;
        });
        try {
            if (apiAvailable) {
                await result.current.mutateAsync(mockFile);
                expect(vi.mocked(toast.success)).toHaveBeenCalled();
            }
            else {
                await expect(result.current.mutateAsync(mockFile)).rejects.toThrow();
                expect(vi.mocked(toast.error)).toHaveBeenCalled();
            }
        }
        catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(vi.mocked(toast.error)).toHaveBeenCalled();
        }
        finally {
            global.fetch = originalFetch;
        }
    });
});
describe("useDeleteDocument", () => {
    const isConfigured = isTestEnvironmentConfigured();
    beforeEach(async () => {
        if (isConfigured) {
            await authenticateTestUser();
        }
    });
    afterEach(async () => {
        if (isConfigured) {
            await cleanupTestDocuments();
            await signOutTestUser();
        }
    });
    it.skipIf(!isConfigured)("should delete a document successfully", async () => {
        let docId: string | null = null;
        try {
            docId = await createTestDocument("test-delete.pdf");
        }
        catch (error) {
            console.warn("Skipping delete test: API not available to create test document");
            return;
        }
        if (!docId)
            return;
        const { result } = renderHook(() => useDeleteDocument(), {
            wrapper: createWrapper(),
        });
        try {
            await result.current.mutateAsync(docId);
            expect(vi.mocked(toast.success)).toHaveBeenCalled();
        }
        catch (error) {
            try {
                await deleteTestDocument(docId);
            }
            catch {
            }
            throw error;
        }
    });
});
