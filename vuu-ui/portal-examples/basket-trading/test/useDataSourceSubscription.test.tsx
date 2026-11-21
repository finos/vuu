import { PortalModuleInstanceContext } from "@vuu-ui/core";
import type {
  DataSourceCallbackMessage,
  DataSourceSubscribeCallback,
  ServerAPI,
} from "@vuu-ui/vuu-data-types";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import { Range } from "@vuu-ui/vuu-utils";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { useBasketSessionScope } from "../src/basket-session";
import { useDataSourceSubscription } from "../src/useDataSourceSubscription";

// @ts-expect-error React test flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const server = vi.hoisted(() => ({
  send: undefined as unknown as Mock,
  subscribe: undefined as unknown as Mock,
}));

vi.mock("../../../packages/vuu-data-remote/src/ConnectionManager", async () => {
  const { vi } = await import("vitest");
  server.send = vi.fn();
  server.subscribe = vi.fn();
  const serverAPI = Promise.resolve({
    rpcCall: vi.fn(),
    send: server.send,
    subscribe: server.subscribe,
    unsubscribe: vi.fn(),
  } as unknown as ServerAPI);
  return {
    default: { serverAPI, serverAPIFor: () => serverAPI },
  };
});

const SUBSCRIBE_PROPS = { range: Range(0, 1) };

const Subscriber = ({
  callback,
  dataSource,
}: {
  callback: DataSourceSubscribeCallback;
  dataSource: VuuDataSource;
}) => {
  useDataSourceSubscription(dataSource, SUBSCRIBE_PROPS, callback);
  return null;
};

const sendFromServer = (message: Partial<DataSourceCallbackMessage>) => {
  const [, handleMessage] = server.subscribe.mock.calls[0];
  act(() => handleMessage(message));
};

describe("useDataSourceSubscription", () => {
  let container: HTMLDivElement;
  let root: Root;
  const unhandled = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    process.on("unhandledRejection", unhandled);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    process.off("unhandledRejection", unhandled);
  });

  const createDataSource = () =>
    new VuuDataSource({
      columns: ["basketId"],
      table: { module: "BASKET", table: "basketTrading" },
      viewport: "basket-trading-control",
    });

  const mount = (dataSource: VuuDataSource, callback = vi.fn()) => {
    act(() => {
      root.render(<Subscriber callback={callback} dataSource={dataSource} />);
    });
  };
  const unmount = () => act(() => root.render(null));

  it("a second subscribe to the same session data source throws", async () => {
    const dataSource = createDataSource();
    await dataSource.subscribe(SUBSCRIBE_PROPS, vi.fn());
    await expect(
      dataSource.subscribe(SUBSCRIBE_PROPS, vi.fn()),
    ).rejects.toThrow("invalid status");
  });

  it("subscribes on first mount, suspends on unmount and resumes on remount", async () => {
    const dataSource = createDataSource();
    const errorSpy = vi.spyOn(console, "error");

    mount(dataSource);
    await vi.waitFor(() => expect(server.subscribe).toHaveBeenCalledTimes(1));
    sendFromServer({ type: "subscribed", tableSchema: {} as never });
    expect(dataSource.status).toBe("subscribed");

    unmount();
    expect(dataSource.status).toBe("suspended");
    expect(server.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "suspend" }),
    );

    const secondCallback = vi.fn();
    mount(dataSource, secondCallback);
    expect(dataSource.status).toBe("subscribed");
    expect(server.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "resume" }),
    );
    expect(server.subscribe).toHaveBeenCalledTimes(1);

    sendFromServer({ type: "viewport-update", size: 3 });
    expect(secondCallback).toHaveBeenCalledWith(
      expect.objectContaining({ type: "viewport-update", size: 3 }),
    );
    expect(errorSpy).not.toHaveBeenCalledWith(
      "[useDataSourceSubscription] subscribe failed",
      expect.anything(),
    );
    expect(unhandled).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not resubscribe when switching tabs before the subscription completes", async () => {
    const dataSource = createDataSource();
    const errorSpy = vi.spyOn(console, "error");

    mount(dataSource);
    unmount();
    mount(dataSource);
    unmount();
    mount(dataSource);

    await vi.waitFor(() => expect(server.subscribe).toHaveBeenCalledTimes(1));
    sendFromServer({ type: "subscribed", tableSchema: {} as never });
    expect(errorSpy).not.toHaveBeenCalledWith(
      "[useDataSourceSubscription] subscribe failed",
      expect.anything(),
    );
    expect(unhandled).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

const ScopeProbe = ({ onScope }: { onScope: (scope: string) => void }) => {
  onScope(useBasketSessionScope());
  return null;
};

describe("useBasketSessionScope", () => {
  it("scopes session data sources to the portal module instance", () => {
    const scopes: string[] = [];
    const onScope = (scope: string) => {
      scopes.push(scope);
    };
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(
        <>
          <PortalModuleInstanceContext.Provider value="item-1">
            <ScopeProbe onScope={onScope} />
          </PortalModuleInstanceContext.Provider>
          <PortalModuleInstanceContext.Provider value="item-2">
            <ScopeProbe onScope={onScope} />
          </PortalModuleInstanceContext.Provider>
        </>,
      );
    });
    act(() => root.unmount());
    expect(scopes).toEqual(["item-1", "item-2"]);
  });
});
