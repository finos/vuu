import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import { LocalServerMonitor } from "../../src/connection-management/VuuServerMonitor";
import {
  ConnectionLostOverlay,
  useLostConnectionStatus,
} from "../../src/remote-module/ConnectionLostOverlay";
import { VuuServerMonitorProvider } from "../../src/server-monitor";
import { testModule } from "../connection-management/test-modules";

const createMonitor = () => {
  const map = new ModuleServerMap({
    loadConfig: async () => ({ vuu: { connectionId: "risk" } }),
    modules: [testModule("m0")],
    portalConnectionId: "local",
  });
  return new LocalServerMonitor({
    localServerIds: ["risk"],
    moduleServerMap: map,
  });
};

/** Mirrors how RemoteModule covers its content. */
const Module = ({ connectionId }: { connectionId?: string }) => {
  const status = useLostConnectionStatus(connectionId);
  return (
    <>
      <div inert={status !== undefined}>
        <button type="button">In the module</button>
      </div>
      {status ? <ConnectionLostOverlay status={status} title="Risk" /> : null}
    </>
  );
};

describe("ConnectionLostOverlay", () => {
  let container: HTMLDivElement;
  let root: Root;
  let monitor: LocalServerMonitor;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    monitor = createMonitor();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  const render = (connectionId?: string) =>
    act(async () =>
      root.render(
        <VuuServerMonitorProvider monitor={monitor}>
          <Module connectionId={connectionId} />
        </VuuServerMonitorProvider>,
      ),
    );

  const dialog = () =>
    container.querySelector<HTMLElement>('[role="alertdialog"]');

  it("covers the module while its server is offline, and offers a retry", async () => {
    const retry = vi.spyOn(monitor, "retry");
    await render("risk");
    expect(dialog()).toBeNull();
    expect(container.querySelector("[inert]")).toBeNull();

    await act(async () => monitor.setPresence("risk", "offline"));
    const overlay = dialog()!;
    expect(overlay.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(overlay);
    expect(
      document.getElementById(overlay.getAttribute("aria-labelledby")!)
        ?.textContent,
    ).toBe("Risk has lost its connection");
    expect(overlay.textContent).toContain("Server not responding");
    expect(container.querySelector("[inert]")?.textContent).toBe(
      "In the module",
    );

    const retryButton = [...overlay.querySelectorAll("button")].find(
      (button) => button.textContent === "Retry now",
    )!;
    await act(async () => retryButton.click());
    expect(retry).toHaveBeenCalledWith("risk");

    await act(async () => monitor.setPresence("risk", undefined));
    expect(dialog()).toBeNull();
    expect(container.querySelector("[inert]")).toBeNull();
  });

  it("explains a denied server without offering a retry", async () => {
    monitor.setPresence("risk", "unauthorized");
    await render("risk");
    const overlay = dialog()!;
    expect(overlay.textContent).toContain("Risk can't access its server");
    expect(overlay.textContent).toContain("Contact your administrator");
    expect(overlay.querySelector("button")).toBeNull();
  });

  it("does nothing for a module without a connection or a monitor", async () => {
    await render(undefined);
    expect(dialog()).toBeNull();

    await act(async () => root.render(<Module connectionId="risk" />));
    expect(dialog()).toBeNull();
  });
});
