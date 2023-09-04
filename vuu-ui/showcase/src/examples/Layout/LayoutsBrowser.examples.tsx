import { LayoutsList, LayoutManagementProvider } from "@finos/vuu-shell";

export const LayoutsBrowser = (): JSX.Element => {
    return (
        <LayoutManagementProvider>
            <LayoutsList />
        </LayoutManagementProvider>
    );
};

