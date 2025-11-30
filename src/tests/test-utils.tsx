import type { ReactElement, ComponentType } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
const AllTheProviders = ({ children }: {
    children: React.ReactNode;
}) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return (<ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>);
};
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
    wrapper?: ComponentType<{
        children: React.ReactNode;
    }>;
}
const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
    const { wrapper: Wrapper, ...restOptions } = options || {};
    const CombinedWrapper = Wrapper
        ? ({ children }: {
            children: React.ReactNode;
        }) => (<AllTheProviders>
          <Wrapper>{children}</Wrapper>
        </AllTheProviders>)
        : AllTheProviders;
    return render(ui, { wrapper: CombinedWrapper, ...restOptions });
};
export * from "@testing-library/react";
export { customRender as render };
