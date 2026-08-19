import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logout = vi.fn(async () => undefined);
vi.mock("@vuu-ui/core", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLogout: () => logout,
}));

import {
  InMemoryPersistenceBackend,
  PortalPersistenceProvider,
  createPortalPersistenceService,
} from "../../src/persistence";
import { usePortalLogout } from "../../src/portal-header/usePortalLogout";

describe("usePortalLogout", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    logout.mockClear();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("writes pending saved state and disposes the service before logging out", async () => {
    const backend = new InMemoryPersistenceBackend();
    const service = createPortalPersistenceService({
      backend,
      user: "steve",
      window: null,
    });
    const store = service.getStore("orders", 1);
    await store.ready;
    store.set("a", 1);

    const order: string[] = [];
    logout.mockImplementation(async () => {
      order.push(`logout:${service.isDisposed()}`);
    });

    let doLogout: () => Promise<void> = async () => undefined;
    const Probe = () => {
      doLogout = usePortalLogout();
      return null;
    };
    await act(async () => {
      root.render(
        <PortalPersistenceProvider service={service}>
          <Probe />
        </PortalPersistenceProvider>,
      );
    });
    await act(() => doLogout());

    expect(order).toEqual(["logout:true"]);
    const document = await backend.load(store.ref);
    expect(document?.entries.a.value).toBe(1);
  });
});
