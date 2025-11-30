import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "../signup-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
vi.mock("@/lib/supabase/client");
vi.mock("sonner");
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));
describe("SignupForm", () => {
    const mockSignUp = vi.fn();
    const mockPush = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
            replace: vi.fn(),
            prefetch: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            refresh: vi.fn(),
        } as any);
        (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
            auth: {
                signUp: mockSignUp,
            },
        } as any);
    });
    it("should render signup form", () => {
        render(<SignupForm />);
        expect(screen.getByText("Criar Conta")).toBeInTheDocument();
        expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
    });
    it("should show error when passwords don't match", async () => {
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
    it("should show error when password is too short", async () => {
        const user = userEvent.setup();
        render(<SignupForm />);
        await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
        await user.type(screen.getByLabelText(/^senha$/i), "12345");
        await user.type(screen.getByLabelText(/confirmar senha/i), "12345");
        await user.click(screen.getByRole("button", { name: /criar conta/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("A senha deve ter pelo menos 6 caracteres");
        });
        expect(mockSignUp).not.toHaveBeenCalled();
    });
    it("should submit form with valid data", async () => {
        const user = userEvent.setup();
        mockSignUp.mockResolvedValue({
            data: { user: {}, session: {} },
            error: null,
        });
        render(<SignupForm />);
        await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
        await user.type(screen.getByLabelText(/^senha$/i), "password123");
        await user.type(screen.getByLabelText(/confirmar senha/i), "password123");
        await user.click(screen.getByRole("button", { name: /criar conta/i }));
        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
            });
        });
        expect(toast.success).toHaveBeenCalledWith("Conta criada com sucesso! Verifique seu email.");
        expect(mockPush).toHaveBeenCalledWith("/login");
    });
    it("should show error toast on signup failure", async () => {
        const user = userEvent.setup();
        const error = { message: "Email already exists" };
        mockSignUp.mockResolvedValue({
            data: { user: null, session: null },
            error,
        });
        render(<SignupForm />);
        await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
        await user.type(screen.getByLabelText(/^senha$/i), "password123");
        await user.type(screen.getByLabelText(/confirmar senha/i), "password123");
        await user.click(screen.getByRole("button", { name: /criar conta/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Email already exists");
        });
        expect(mockPush).not.toHaveBeenCalled();
    });
    it("should show link to login page", () => {
        render(<SignupForm />);
        const loginLink = screen.getByRole("link", { name: /fazer login/i });
        expect(loginLink).toHaveAttribute("href", "/login");
    });
});
