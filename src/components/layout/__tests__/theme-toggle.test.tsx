import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../theme-toggle";
import * as nextThemes from "next-themes";
vi.mock("next-themes", async () => {
    const actual = await vi.importActual<typeof nextThemes>("next-themes");
    return {
        ...actual,
        useTheme: vi.fn(),
    };
});
describe("ThemeToggle", () => {
    const mockSetTheme = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (nextThemes.useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
            theme: "light",
            setTheme: mockSetTheme,
            themes: ["light", "dark"],
            systemTheme: "light",
            resolvedTheme: "light",
        } as any);
    });
    it("should render toggle button", () => {
        render(<ThemeToggle />);
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
    });
    it("should show moon icon in light theme", () => {
        render(<ThemeToggle />);
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
    });
    it("should show sun icon in dark theme", () => {
        (nextThemes.useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
            theme: "dark",
            setTheme: mockSetTheme,
            themes: ["light", "dark"],
            systemTheme: "dark",
            resolvedTheme: "dark",
        } as any);
        render(<ThemeToggle />);
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
    });
    it("should toggle theme on click", async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);
        const button = screen.getByRole("button");
        await user.click(button);
        expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
    it("should toggle from dark to light", async () => {
        const user = userEvent.setup();
        (nextThemes.useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
            theme: "dark",
            setTheme: mockSetTheme,
            themes: ["light", "dark"],
            systemTheme: "dark",
            resolvedTheme: "dark",
        } as any);
        render(<ThemeToggle />);
        const button = screen.getByRole("button");
        await user.click(button);
        expect(mockSetTheme).toHaveBeenCalledWith("light");
    });
});
