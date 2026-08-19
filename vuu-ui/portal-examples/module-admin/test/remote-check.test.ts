import { describe, expect, it, vi } from "vitest";
import {
  compareRemote,
  fetchManifest,
  manifestUrl,
  parseManifest,
} from "../src/data/remote-check";

const MODULE = {
  mfComponent: "VuuBasketTradingFeature",
  mfScope: "basketTrading",
  mfUrl: "http://localhost:5006/",
};

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
    const fetchImpl = vi.fn().mockResolvedValue(
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
    expect(result).toEqual({
      checkedAt: 142,
      elapsedMs: 42,
      exposes: ["VuuBasketTradingFeature"],
      name: "basketTrading",
      status: "loaded",
    });
  });

  it("reports HTTP, network and parse failures as unreachable", async () => {
    const http = await fetchManifest(
      MODULE.mfUrl,
      vi.fn().mockResolvedValue(new Response("", { status: 404 })),
      clock(1, 2),
    );
    expect(http).toEqual({
      checkedAt: 2,
      error: "mf-manifest.json returned HTTP 404",
      status: "unreachable",
    });
    const network = await fetchManifest(
      MODULE.mfUrl,
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      clock(1, 2),
    );
    expect(network).toMatchObject({ error: "Network or CORS error" });
    const invalid = await fetchManifest(
      MODULE.mfUrl,
      vi.fn().mockResolvedValue(new Response("{}")),
      clock(1, 2),
    );
    expect(invalid).toMatchObject({
      error: "Not a module federation manifest",
    });
  });
});

describe("compareRemote", () => {
  const loaded = (name: string, exposes: string[]) =>
    ({ checkedAt: 5, elapsedMs: 3, exposes, name, status: "loaded" }) as const;

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
