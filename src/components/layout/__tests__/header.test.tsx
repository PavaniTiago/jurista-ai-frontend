import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { Header } from "../header";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMockSupabaseClient } from "@/tests/mocks/supabase";
vi.mock("@/hooks/use-auth");
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));
vi.mock("sonner");
describe("Header", () => {
    const mockPush = vi.fn();
    const mockRefresh = vi.fn();
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
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
    });
    it("should render logo and title", () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: null,
            loading: false,
            supabase: createMockSupabaseClient() as any,
        });
        render(<Header />);
        expect(screen.getByText("Jurista AI")).toBeInTheDocument();
        const logoLink = screen.getByRole("link", { name: /jurista ai/i });
        expect(logoLink).toHaveAttribute("href", "/dashboard");
    });
    it("should show theme toggle", () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: null,
            loading: false,
            supabase: createMockSupabaseClient() as any,
        });
        render(<Header />);
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
    });
    it("should show user avatar when logged in", () => {
        const mockUser = {
            id: "user-1",
            email: "test@example.com",
        };
        const mockSupabase = createMockSupabaseClient();
        mockSupabase.auth.signOut = mockSignOut;
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: mockUser as any,
            loading: false,
            supabase: mockSupabase as any,
        });
        render(<Header />);
        expect(screen.getByText("T")).toBeInTheDocument();
    });
    it("should not show user menu when not logged in", () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: null,
            loading: false,
            supabase: createMockSupabaseClient() as any,
        });
        render(<Header />);
        expect(screen.queryByText("Sair")).not.toBeInTheDocument();
    });
    it("should handle logout", async () => {
        const user = userEvent.setup();
        const mockUser = {
            id: "user-1",
            email: "test@example.com",
        };
        const mockSupabase = createMockSupabaseClient();
        mockSupabase.auth.signOut = mockSignOut;
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: mockUser as any,
            loading: false,
            supabase: mockSupabase as any,
        });
        render(<Header />);
        const avatarButton = screen.getByText("T").closest("button");
        await user.click(avatarButton!);
        const logoutButton = screen.getByText("Sair");
        await user.click(logoutButton);
        expect(mockSignOut).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Logout realizado com sucesso");
        expect(mockPush).toHaveBeenCalledWith("/login");
        expect(mockRefresh).toHaveBeenCalled();
    });
    it("should navigate to dashboard from menu", async () => {
        const user = userEvent.setup();
        const mockUser = {
            id: "user-1",
            email: "test@example.com",
        };
        const mockSupabase = createMockSupabaseClient();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: mockUser as any,
            loading: false,
            supabase: mockSupabase as any,
        });
        render(<Header />);
        const avatarButton = screen.getByText("T").closest("button");
        await user.click(avatarButton!);
        const dashboardButton = screen.getByText("Dashboard");
        await user.click(dashboardButton);
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
});
