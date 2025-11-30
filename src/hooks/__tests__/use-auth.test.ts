import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "../use-auth";
import { authenticateTestUser, signOutTestUser, isTestEnvironmentConfigured } from "@/tests/test-helpers";
describe("useAuth", () => {
    const isConfigured = isTestEnvironmentConfigured();
    beforeEach(async () => {
        if (isConfigured) {
            await signOutTestUser();
        }
    });
    afterEach(async () => {
        if (isConfigured) {
            await signOutTestUser();
        }
    });
    it.skipIf(!isConfigured)("should initialize with loading state", async () => {
        const { result } = renderHook(() => useAuth());
        expect(result.current.loading).toBe(true);
        expect(result.current.user).toBeNull();
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 5000 });
    });
    it.skipIf(!isConfigured)("should load user after authentication", async () => {
        await authenticateTestUser();
        const { result } = renderHook(() => useAuth());
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 5000 });
        expect(result.current.user).toBeTruthy();
        expect(result.current.user?.email).toBeTruthy();
    });
    it.skipIf(!isConfigured)("should provide supabase client", async () => {
        const { result } = renderHook(() => useAuth());
        await waitFor(() => {
            expect(result.current.supabase).toBeDefined();
            expect(result.current.supabase.auth).toBeDefined();
        }, { timeout: 5000 });
    });
    it.skipIf(!isConfigured)("should handle authentication state changes", async () => {
        const { result } = renderHook(() => useAuth());
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 5000 });
        await authenticateTestUser();
        await waitFor(() => {
            expect(result.current.user).toBeTruthy();
        }, { timeout: 5000 });
    });
});
