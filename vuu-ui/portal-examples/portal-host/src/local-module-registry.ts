import type { PortalModuleRegistry } from "@vuu-ui/core";
import { simulModule } from "@vuu-ui/vuu-data-test";

export const localPortalModuleRegistry = {
  modules: [
    {
      clientIdentifier: "local-basket-trading",
      description: "Trade baskets with local test data",
      enabled: true,
      id: "local-basket-trading",
      location: "/Trading/Baskets",
      loginRole: "local",
      mfComponent: "VuuBasketTradingFeatureLocal",
      mfScope: "basketTrading",
      mfUrl: "http://localhost:5005",
      name: "basket-trading",
      path: "/trading/baskets",
      title: "Basket Trading",
      version: 1,
    },
    {
      clientIdentifier: "local-feature-filter-table",
      ComponentProps: {
        tableSchema: simulModule.schemas.instruments,
      },
      description: "Browse instruments with local test data",
      enabled: true,
      id: "local-feature-filter-table",
      location: "/Tables/Instruments",
      loginRole: "local",
      mfComponent: "VuuFilterTableFeatureLocal",
      mfScope: "filterTable",
      mfUrl: "http://localhost:5003",
      name: "feature-filter-table",
      path: "/tables/instruments",
      title: "Instruments",
      version: 1,
    },
  ],
} satisfies PortalModuleRegistry;
