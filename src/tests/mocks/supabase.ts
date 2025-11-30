import { vi } from "vitest";
export const createMockSupabaseClient = () => {
    const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
    };
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: mockUser },
                error: null,
            }),
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: mockUser, session: {} },
                error: null,
            }),
            signUp: vi.fn().mockResolvedValue({
                data: { user: mockUser, session: {} },
                error: null,
            }),
            signOut: vi.fn().mockResolvedValue({
                error: null,
            }),
            onAuthStateChange: vi.fn().mockReturnValue({
                data: {
                    subscription: {
                        unsubscribe: vi.fn(),
                    },
                },
            }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
};
