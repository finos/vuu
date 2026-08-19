import { createRoot } from "react-dom/client";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { SaltProviderNext } from "@salt-ds/core";
import VuuBasketTradingFeature from "./VuuBasketTradingFeature";
export default VuuBasketTradingFeature;
export type { basketDataSourceKey } from "./useBasketTradingDatasources";
export { BasketSelector } from "./basket-selector";
export { BasketToolbar } from "./basket-toolbar";
export { NewBasketDialog } from "./new-basket-dialog/NewBasketDialog";
export { Basket } from "./useBasketTrading";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root element not found");

  const root = createRoot(container);
  root.render(
    <SaltProviderNext theme="vuu-theme" density="high">
      <LocalDataSourceProvider>
        <div style={{ width: "100vw", height: "100vh" }}>
          <VuuBasketTradingFeature />
        </div>
      </LocalDataSourceProvider>
    </SaltProviderNext>,
  );
}

start();
