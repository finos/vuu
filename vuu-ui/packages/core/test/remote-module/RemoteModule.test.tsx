import { act, Suspense } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@module-federation/enhanced/runtime", () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}));

import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import {
  AuthenticationProvider,
  useOptionalVuuConnectionId,
} from "../../src/auth/AuthenticationProvider";
import type { LocalVuuServer } from "../../src/auth/AuthenticationProvider";
import { RemoteModule } from "../../src/remote-module/RemoteModule";
import { useContextPanel } from "../../src/context-panel/ContextPanelProvider";
import {
  ShellContextPanel,
  ShellContextPanelProvider,
} from "../../src/context-panel/ShellContextPanel";

/** The config.json served by each remote, keyed by its URL. */
const remoteConfigs = new Map<string, string>();

const ConnectionProbe = () => (
  <div>connection:{useOptionalVuuConnectionId() ?? "none"}</div>
);

const localServer = (connectionId: string): LocalVuuServer => ({
  connectionId,
  DataSourceProvider: ({ children }) => children,
});

const RemoteModuleRoute = () => {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/healthy")} type="button">
        Open healthy module
      </button>
      <Suspense fallback="Loading">
        <RemoteModule
          mfComponent="Remote"
          mfScope="remote"
          mfUrl="http://localhost:5000"
        />
      </Suspense>
    </>
  );
};

describe("RemoteModule", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.mocked(loadRemote).mockResolvedValue({
      default: () => <div>Connectionless remote loaded</div>,
    });
    vi.mocked(registerRemotes).mockImplementation(() => {});
    remoteConfigs.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) => new Response(remoteConfigs.get(url) ?? "{}"),
      ),
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderInLocalPortal = async (
    mfUrl: string,
    props: Partial<Parameters<typeof RemoteModule>[0]> = {},
  ) => {
    vi.mocked(loadRemote).mockResolvedValue({ default: ConnectionProbe });
    await act(async () => {
      root.render(
        <AuthenticationProvider
          localServers={[localServer("orders"), localServer("override")]}
          mode="local"
        >
          <Suspense fallback="Loading">
            <RemoteModule
              mfComponent="Orders"
              mfScope="orders"
              mfUrl={mfUrl}
              {...props}
            />
          </Suspense>
        </AuthenticationProvider>,
      );
    });
  };

  it("connects a remote to the Vuu server named in its config.json", async () => {
    remoteConfigs.set(
      "http://localhost:5100/config.json",
      JSON.stringify({ connectionId: "orders" }),
    );
    await renderInLocalPortal("http://localhost:5100/");

    expect(fetch).toHaveBeenCalledWith("http://localhost:5100/config.json");
    expect(container.textContent).toBe("connection:orders");
  });

  it("uses the portal connection when config.json names no Vuu server", async () => {
    await renderInLocalPortal("http://localhost:5101");

    expect(container.textContent).toBe("connection:local");
  });

  it("prefers an explicit vuu prop to config.json", async () => {
    remoteConfigs.set(
      "http://localhost:5102/config.json",
      JSON.stringify({ connectionId: "orders" }),
    );
    await renderInLocalPortal("http://localhost:5102", {
      vuu: { connectionId: "override" },
    });

    expect(container.textContent).toBe("connection:override");
  });

  it("reports a remote whose config.json is missing", async () => {
    // Static servers answer unknown paths with index.html.
    remoteConfigs.set("http://localhost:5103/config.json", "<!doctype html>");
    const onError = vi.fn();
    await renderInLocalPortal("http://localhost:5103", { onError });

    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("is not valid JSON"),
        name: "RemoteModuleConfigError",
      }),
    );
  });

  it("loads a remote without a Vuu connection when metadata is absent", async () => {
    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="ConnectionlessRemote"
            mfScope="connectionless"
            mfUrl="http://localhost:5000"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toBe("Connectionless remote loaded");
  });

  it("recovers from an error while registering a remote module", async () => {
    vi.mocked(registerRemotes).mockImplementation(() => {
      throw Error("Unable to register remote module");
    });

    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="BrokenRemote"
            mfScope="broken"
            mfUrl="http://localhost:5000"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );

    vi.mocked(registerRemotes).mockImplementation(() => {});

    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="WorkingRemote"
            mfScope="working"
            mfUrl="http://localhost:5001"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toBe("Connectionless remote loaded");
  });

  it("retries a failed remote module after navigation", async () => {
    vi.mocked(loadRemote).mockRejectedValueOnce(
      Error("Failed to load remote module"),
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/broken"]}>
          <RemoteModuleRoute />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );

    await act(async () => {
      container.querySelector("button")?.click();
    });

    expect(container.textContent).toContain("Connectionless remote loaded");
  });

  describe("mfExport", () => {
    beforeEach(() => {
      vi.mocked(loadRemote).mockResolvedValue({
        First: () => <div>First example</div>,
        Second: () => <div>Second example</div>,
      });
    });

    const renderExport = async (mfExport: string, onError = vi.fn()) => {
      await act(async () => {
        root.render(
          <Suspense fallback="Loading">
            <RemoteModule
              key={mfExport}
              mfComponent="examples/Named"
              mfExport={mfExport}
              mfScope="named"
              mfUrl="http://localhost:5200"
              onError={onError}
            />
          </Suspense>,
        );
      });
      return onError;
    };

    it("renders a named export of the module", async () => {
      await renderExport("Second");
      expect(container.textContent).toBe("Second example");

      await renderExport("First");
      expect(container.textContent).toBe("First example");
      // Both components come from one load of the module.
      expect(
        vi
          .mocked(loadRemote)
          .mock.calls.filter(([id]) => id === "named/examples/Named"),
      ).toHaveLength(1);
    });

    it("reports a missing export", async () => {
      const onError = await renderExport("Missing");

      expect(container.textContent).toContain(
        "An error occurred while creating the remote module.",
      );
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Remote module named/examples/Named has no component export 'Missing'",
        }),
      );
    });
  });

  describe("context panel", () => {
    const ContextPanelRemote = () => {
      const showContextPanel = useContextPanel();
      return (
        <button
          data-show-context-panel
          onClick={() => showContextPanel(<ConnectionProbe />, "Settings")}
          type="button"
        >
          Settings
        </button>
      );
    };

    const renderInShell = async (
      mfUrl: string,
      props: Partial<Parameters<typeof RemoteModule>[0]> = {},
    ) => {
      remoteConfigs.set(
        `${mfUrl}/config.json`,
        JSON.stringify({ connectionId: "orders" }),
      );
      vi.mocked(loadRemote).mockResolvedValue({ default: ContextPanelRemote });
      await act(async () => {
        root.render(
          <AuthenticationProvider
            localServers={[localServer("orders")]}
            mode="local"
          >
            <ShellContextPanelProvider>
              <div data-module-frame>
                <Suspense fallback="Loading">
                  <RemoteModule
                    mfComponent="Settings"
                    mfScope="settings"
                    mfUrl={mfUrl}
                    {...props}
                  />
                </Suspense>
              </div>
              <ShellContextPanel />
            </ShellContextPanelProvider>
          </AuthenticationProvider>,
        );
      });
      await act(async () => {
        container
          .querySelector<HTMLButtonElement>("[data-show-context-panel]")
          ?.click();
      });
    };

    it("shows content in the shell's panel, with the module's context", async () => {
      await renderInShell("http://localhost:5110");

      expect(
        container.querySelector("#vuu-shell-context .vuuContextPanel-content")
          ?.textContent,
      ).toBe("connection:orders");
      expect(container.querySelector(".vuuModuleContextPanel")).toBeNull();
    });

    it("shows content in a panel within the module's frame", async () => {
      await renderInShell("http://localhost:5111", {
        contextPanelPlacement: "module",
      });

      expect(
        container.querySelector(
          "[data-module-frame] .vuuModuleContextPanel .vuuContextPanel-content",
        )?.textContent,
      ).toBe("connection:orders");
      expect(
        container.querySelector("#vuu-shell-context .vuuContextPanel")
          ?.classList,
      ).not.toContain("vuuContextPanel-expanded");
    });
  });
});
