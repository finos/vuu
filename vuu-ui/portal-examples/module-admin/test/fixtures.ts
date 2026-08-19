import {
  EMPTY_MODULE_CONFIG,
  type ManagedModule,
} from "@heswell/module-admin/contracts";

export const managedModule = (
  overrides: Partial<ManagedModule> & Pick<ManagedModule, "id" | "name">,
): ManagedModule => ({
  ...EMPTY_MODULE_CONFIG,
  created: 1_000,
  enabled: true,
  title: overrides.name,
  updated: 1_000,
  version: 1,
  ...overrides,
});

export const MODULES: ManagedModule[] = [
  managedModule({
    accessRole: "basket-trading-access",
    id: 1,
    location: "/Trading/Baskets",
    mfComponent: "VuuBasketTradingFeature",
    mfScope: "basketTrading",
    mfUrl: "http://localhost:5006",
    name: "basket-trading",
    path: "/basket/trade",
    title: "Basket trading",
    updated: 3_000,
    vuuConnectionId: "basket",
    vuuRestUrl: "https://localhost:8445/api/authn",
    vuuWebsocketUrl: "wss://localhost:8093/websocket",
  }),
  managedModule({
    accessRole: "vuu-table-browser-access",
    id: 2,
    location: "/Tools/Tables",
    mfComponent: "VuuTableBrowser",
    mfScope: "vuuTableBrowser",
    mfUrl: "http://localhost:5004",
    name: "vuu-table-browser",
    path: "/tools/tables",
    title: "Browse tables",
    updated: 2_000,
  }),
  managedModule({
    id: 3,
    mfComponent: "VuuTableViewer",
    mfScope: "vuuTableViewer",
    mfUrl: "http://localhost:5005",
    name: "vuu-table-viewer",
    parentModuleId: 2,
    title: "View table",
  }),
  managedModule({
    enabled: false,
    id: 4,
    location: "/Trading/Orders",
    mfComponent: "OrderBlotter",
    mfScope: "orderBlotter",
    mfUrl: "http://localhost:5009",
    name: "order-blotter",
    path: "/trading/orders",
    title: "Order blotter",
    vuuConnectionId: "orders",
  }),
];
