import {
  LocalWorkspacePersistenceService,
  RemoteWorkspacePersistenceService,
  WorkspacePersistentStateProvider,
  WorkspacePersistentStateStore,
} from "@vuu-ui/vuu-shell";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWorkspacePersistenceService,
  type RemoteWorkspacePersistenceConfig,
} from "../src/app-config";
import { SortStateFixture } from "../src/sample-workspace";

describe("sample app workspace configuration", () => {
  it("selects local persistence with the authenticated user's scope", () => {
    const service = createWorkspacePersistenceService(
      {
        applicationId: "sample",
        namespace: "test.local",
        type: "local",
      },
      "alice",
      { storage: localStorage },
    );

    expect(service).toBeInstanceOf(LocalWorkspacePersistenceService);
    expect(service.scope).toEqual({
      applicationId: "sample",
      applicationNamespace: "test.local",
      userId: "alice",
    });
  });

  it("selects remote persistence and supplies auth and user context without fallback", async () => {
    const config: RemoteWorkspacePersistenceConfig = {
      applicationId: "sample",
      auth: {
        credentials: "include",
        headers: { "X-App-Auth": "configured" },
      },
      baseUrl: "https://workspaces.example.test/api",
      namespace: "test.remote",
      type: "remote",
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(undefined, { status: 404 }));
    const service = createWorkspacePersistenceService(config, "bob", {
      fetch: fetchMock,
      getIdentityToken: async () => "identity-token",
    });

    expect(service).toBeInstanceOf(RemoteWorkspacePersistenceService);
    await service.loadApplicationSession();
    const [url, request] = fetchMock.mock.calls[0];
    const headers = new Headers(request?.headers);
    expect(url).toBe(
      "https://workspaces.example.test/api/test.remote/sample/bob/application-session",
    );
    expect(request?.credentials).toBe("include");
    expect(headers.get("Authorization")).toBe("Bearer identity-token");
    expect(headers.get("X-App-Auth")).toBe("configured");
    expect(headers.get("X-Vuu-User-Id")).toBe("bob");
  });
});

describe("sample sort fixture persistence", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("restores state synchronously on first mount and updates through the store", () => {
    const store = new WorkspacePersistentStateStore({
      table: {
        componentType: "sample-sort-fixture",
        schemaVersion: 1,
        value: { sort: [{ column: "price", direction: "desc" }] },
      },
    });

    act(() => {
      root.render(
        <WorkspacePersistentStateProvider store={store}>
          <SortStateFixture
            componentId="table"
            settings={{ columns: ["price"], title: "Test table" }}
          />
        </WorkspacePersistentStateProvider>,
      );
    });
    expect(
      container.querySelector('[data-testid="sort-state"]')?.textContent,
    ).toBe("price desc");

    act(() => {
      (container.querySelector("button") as HTMLButtonElement).click();
    });
    expect(store.get("table")?.value).toEqual({
      sort: [{ column: "price", direction: "asc" }],
    });
  });
});
