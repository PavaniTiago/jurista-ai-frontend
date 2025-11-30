import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(),
}));
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));
describe("Auth Flow Integration", () => {
    const mockPush = vi.fn();
    const mockRefresh = vi.fn();
    const mockSignIn = vi.fn();
    const mockSignUp = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
            replace: vi.fn(),
            prefetch: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            refresh: mockRefresh,
        } as any);
        (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
            auth: {
                signInWithPassword: mockSignIn,
                signUp: mockSignUp,
            },
        } as any);
    });
    describe("Login Flow", () => {
        it("should complete full login flow", async () => {
            const user = userEvent.setup();
            mockSignIn.mockResolvedValue({
                data: { user: { id: "user-1", email: "test@example.com" }, session: {} },
                error: null,
            });
            render(<LoginForm />);
            await user.type(screen.getByLabelText(/email/i), "test@example.com");
            await user.type(screen.getByLabelText(/senha/i), "password123");
            await user.click(screen.getByRole("button", { name: /entrar/i }));
            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith({
                    email: "test@example.com",
                    password: "password123",
                });
            });
            expect(toast.success).toHaveBeenCalledWith("Login realizado com sucesso!");
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
            expect(mockRefresh).toHaveBeenCalled();
        });
        it("should handle login errors gracefully", async () => {
            const user = userEvent.setup();
            mockSignIn.mockResolvedValue({
                data: { user: null, session: null },
                error: { message: "Invalid credentials" },
            });
            render(<LoginForm />);
            await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
            await user.type(screen.getByLabelText(/senha/i), "wrongpassword");
            await user.click(screen.getByRole("button", { name: /entrar/i }));
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
            });
            expect(mockPush).not.toHaveBeenCalled();
        });
    });
    describe("Signup Flow", () => {
        it("should complete full signup flow", async () => {
            const user = userEvent.setup();
            mockSignUp.mockResolvedValue({
                data: { user: { id: "user-1", email: "new@example.com" }, session: {} },
                error: null,
            });
            render(<SignupForm />);
            await user.type(screen.getByLabelText(/^email$/i), "new@example.com");
            await user.type(screen.getByLabelText(/^senha$/i), "password123");
            await user.type(screen.getByLabelText(/confirmar senha/i), "password123");
            await user.click(screen.getByRole("button", { name: /criar conta/i }));
            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith({
                    email: "new@example.com",
                    password: "password123",
                });
            });
            expect(toast.success).toHaveBeenCalledWith("Conta criada com sucesso! Verifique seu email.");
            expect(mockPush).toHaveBeenCalledWith("/login");
        });
        it("should validate password match before signup", async () => {
            const user = userEvent.setup();
            render(<SignupForm />);
            await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
            await user.type(screen.getByLabelText(/^senha$/i), "password123");
            await user.type(screen.getByLabelText(/confirmar senha/i), "different123");
            await user.click(screen.getByRole("button", { name: /criar conta/i }));
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("As senhas não coincidem");
            });
            expect(mockSignUp).not.toHaveBeenCalled();
        });
    });
});
