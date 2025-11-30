import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
vi.mock("@/lib/supabase/client");
vi.mock("sonner");
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));
describe("LoginForm", () => {
    const mockSignIn = vi.fn();
    const mockPush = vi.fn();
    const mockRefresh = vi.fn();
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
            },
        } as any);
    });
    it("should render login form", () => {
        render(<LoginForm />);
        expect(screen.getByText("Bem-vindo ao Jurista AI")).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });
    it("should show validation error for empty fields", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        const submitButton = screen.getByRole("button", { name: /entrar/i });
        await user.click(submitButton);
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toBeInvalid();
    });
    it("should submit form with valid credentials", async () => {
        const user = userEvent.setup();
        mockSignIn.mockResolvedValue({
            data: { user: {}, session: {} },
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
    it("should show error toast on login failure", async () => {
        const user = userEvent.setup();
        const error = { message: "Invalid credentials" };
        mockSignIn.mockResolvedValue({
            data: { user: null, session: null },
            error,
        });
        render(<LoginForm />);
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/senha/i), "wrongpassword");
        await user.click(screen.getByRole("button", { name: /entrar/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
        });
        expect(mockPush).not.toHaveBeenCalled();
    });
    it("should disable form during loading", async () => {
        const user = userEvent.setup();
        let resolveSignIn: (value: any) => void;
        const signInPromise = new Promise((resolve) => {
            resolveSignIn = resolve;
        });
        mockSignIn.mockReturnValue(signInPromise);
        render(<LoginForm />);
        await user.type(screen.getByLabelText(/email/i), "test@example.com");
        await user.type(screen.getByLabelText(/senha/i), "password123");
        await user.click(screen.getByRole("button", { name: /entrar/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /entrando/i })).toBeInTheDocument();
        });
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/senha/i)).toBeDisabled();
        resolveSignIn!({
            data: { user: {}, session: {} },
            error: null,
        });
    });
    it("should show link to signup page", () => {
        render(<LoginForm />);
        const signupLink = screen.getByRole("link", { name: /criar conta/i });
        expect(signupLink).toHaveAttribute("href", "/signup");
    });
});
