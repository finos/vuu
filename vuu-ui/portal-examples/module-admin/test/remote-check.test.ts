import { describe, expect, it, vi } from "vitest";
import {
  compareRemote,
  fetchManifest,
  fetchRemoteConfig,
  manifestUrl,
  parseManifest,
  type RemoteConfigResult,
} from "../src/data/remote-check";

const MODULE = {
  mfComponent: "VuuBasketTradingFeature",
  mfScope: "basketTrading",
  mfUrl: "http://localhost:5006/",
};

const BASKET_CONFIG = {
  connectionId: "basket",
  restUrl: "https://localhost:8445/api/authn",
  websocketUrl: "wss://localhost:8093/websocket-basket-trading",
};

/** A fetch that answers config.json and mf-manifest.json separately. */
const remoteFetch = (
  manifest: () => Promise<Response>,
  config: () => Promise<Response> = async () =>
    new Response(JSON.stringify(BASKET_CONFIG)),
) =>
  vi.fn((url: string) =>
    url.endsWith("/config.json") ? config() : manifest(),
  ) as unknown as typeof fetch & ReturnType<typeof vi.fn>;

const clock = (...times: number[]) => {
  const now = vi.fn();
  for (const time of times) now.mockReturnValueOnce(time);
  return now;
};

describe("parseManifest", () => {
  it("reads the federation name and exposed components", () => {
    expect(
      parseManifest({
        exposes: [
          {
            name: "VuuBasketTradingFeature",
            path: "./VuuBasketTradingFeature",
          },
          { name: "Other" },
          "junk",
        ],
        name: "basketTrading",
      }),
    ).toEqual({
      exposes: ["VuuBasketTradingFeature", "Other"],
      name: "basketTrading",
    });
  });

  it("rejects anything that is not a manifest", () => {
    expect(() => parseManifest({ exposes: [] })).toThrow(
      "Not a module federation manifest",
    );
    expect(() => parseManifest(null)).toThrow();
  });
});

describe("fetchManifest", () => {
  it("fetches mf-manifest.json from the remote URL", async () => {
    const fetchImpl = remoteFetch(
      async () =>
        new Response(
          JSON.stringify({
            exposes: [{ path: "./VuuBasketTradingFeature" }],
            name: "basketTrading",
          }),
        ),
    );
    const result = await fetchManifest(
      MODULE.mfUrl,
      fetchImpl,
      clock(100, 142),
    );
    expect(manifestUrl(MODULE.mfUrl)).toBe(
      "http://localhost:5006/mf-manifest.json",
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:5006/mf-manifest.json",
      { cache: "no-store" },
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:5006/config.json",
      { cache: "no-store" },
    );
    expect(result).toEqual({
      checkedAt: 142,
      config: { status: "loaded", vuu: BASKET_CONFIG },
      elapsedMs: 42,
      exposes: ["VuuBasketTradingFeature"],
      name: "basketTrading",
      status: "loaded",
    });
  });

  it("reports HTTP, network and parse failures as unreachable", async () => {
    const http = await fetchManifest(
      MODULE.mfUrl,
      remoteFetch(async () => new Response("", { status: 404 })),
      clock(1, 2),
    );
    expect(http).toEqual({
      checkedAt: 2,
      error: "mf-manifest.json returned HTTP 404",
      status: "unreachable",
    });
    const network = await fetchManifest(
      MODULE.mfUrl,
      remoteFetch(async () => {
        throw new TypeError("Failed to fetch");
      }),
      clock(1, 2),
    );
    expect(network).toMatchObject({ error: "Network or CORS error" });
    const invalid = await fetchManifest(
      MODULE.mfUrl,
      remoteFetch(async () => new Response("{}")),
      clock(1, 2),
    );
    expect(invalid).toMatchObject({
      error: "Not a module federation manifest",
    });
  });
});

describe("compareRemote", () => {
  const loaded = (
    name: string,
    exposes: string[],
    config: RemoteConfigResult = { status: "loaded", vuu: BASKET_CONFIG },
  ) =>
    ({
      checkedAt: 5,
      config,
      elapsedMs: 3,
      exposes,
      name,
      status: "loaded",
    }) as const;

  it("is undefined until a check has been requested", () => {
    expect(compareRemote(MODULE, undefined)).toBeUndefined();
    expect(compareRemote(MODULE, { status: "checking" })?.status).toBe(
      "checking",
    );
  });

  it("passes when scope and exposed component match", () => {
    const check = compareRemote(
      { ...MODULE, mfComponent: "./VuuBasketTradingFeature" },
      loaded("basketTrading", ["VuuBasketTradingFeature"]),
    );
    expect(check?.status).toBe("ok");
    expect(check?.items.every(({ ok }) => ok)).toBe(true);
  });

  it("reports a scope or component mismatch", () => {
    expect(
      compareRemote(MODULE, loaded("other", ["VuuBasketTradingFeature"]))
        ?.summary,
    ).toBe("Remote declares scope other, not basketTrading");
    const missing = compareRemote(MODULE, loaded("basketTrading", ["A"]));
    expect(missing?.status).toBe("mismatch");
    expect(missing?.summary).toBe(
      "Remote does not expose ./VuuBasketTradingFeature",
    );
    expect(missing?.items[2].detail).toContain("(./A)");
  });

  it("lists the Vuu connection declared in config.json", () => {
    const check = compareRemote(
      MODULE,
      loaded("basketTrading", ["VuuBasketTradingFeature"]),
    );
    expect(check?.configItems).toEqual([
      {
        detail: "config.json · Vuu server basket",
        label: "Config",
        ok: true,
      },
      { detail: "basket", label: "Connection id", ok: true },
      {
        detail: "wss://localhost:8093/websocket-basket-trading",
        label: "WebSocket URL",
        ok: true,
      },
      {
        detail: "https://localhost:8445/api/authn",
        label: "Auth (REST) URL",
        ok: true,
      },
    ]);
    const noVuu = compareRemote(
      MODULE,
      loaded("basketTrading", ["VuuBasketTradingFeature"], {
        status: "loaded",
      }),
    );
    expect(noVuu?.status).toBe("ok");
    expect(noVuu?.configItems).toEqual([
      {
        detail: "config.json · uses the portal's Vuu connection",
        label: "Config",
        ok: true,
      },
    ]);
  });

  it("reports a missing or invalid config.json as a mismatch", () => {
    const check = compareRemote(
      MODULE,
      loaded("basketTrading", ["VuuBasketTradingFeature"], {
        error: "config.json is missing or not valid JSON",
        status: "invalid",
      }),
    );
    expect(check?.status).toBe("mismatch");
    expect(check?.summary).toBe("Remote config.json is missing or invalid");
    expect(check?.configItems).toEqual([
      {
        detail: "config.json is missing or not valid JSON",
        label: "Config",
        ok: false,
      },
    ]);
    expect(check?.items.every(({ ok }) => ok)).toBe(true);
  });

  it("reports an unreachable remote by host", () => {
    const check = compareRemote(MODULE, {
      checkedAt: 5,
      error: "Network or CORS error",
      status: "unreachable",
    });
    expect(check?.status).toBe("unreachable");
    expect(check?.summary).toBe(
      "Remote not reachable from this browser at localhost:5006",
    );
  });
});

describe("fetchRemoteConfig", () => {
  const config = (body: string, init?: ResponseInit) =>
    fetchRemoteConfig(
      MODULE.mfUrl,
      vi.fn().mockResolvedValue(new Response(body, init)),
    );

  it("reads the Vuu connection, or none", async () => {
    expect(await config(JSON.stringify(BASKET_CONFIG))).toEqual({
      status: "loaded",
      vuu: BASKET_CONFIG,
    });
    expect(await config("{}")).toEqual({ status: "loaded" });
  });

  it("reports missing, unreachable and invalid configs", async () => {
    expect(await config("", { status: 404 })).toEqual({
      error: "config.json returned HTTP 404",
      status: "invalid",
    });
    expect(await config("<!doctype html>")).toEqual({
      error: "config.json is missing or not valid JSON",
      status: "invalid",
    });
    expect(await config(JSON.stringify({ restUrl: "x" }))).toEqual({
      error:
        "config.json: connectionId is required when restUrl or websocketUrl is set",
      status: "invalid",
    });
    expect(
      await fetchRemoteConfig(
        MODULE.mfUrl,
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      ),
    ).toEqual({ error: "Network or CORS error", status: "invalid" });
  });
});
