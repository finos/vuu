import { afterEach, describe, expect, it, vi } from "vitest";
import { getRegisteredModules } from "../../src/module-registry/getRegisteredModules";

describe("getRegisteredModules", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("always requests a fresh registry response", async () => {
    const modules = [{ id: "test-module" }];
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ modules }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getRegisteredModules("/module-registry.json", "identity-token"),
    ).resolves.toEqual({ modules });
    expect(fetchMock).toHaveBeenCalledWith(
      "/module-registry.json",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("rejects unsuccessful registry responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(
      getRegisteredModules("/module-registry.json", "identity-token"),
    ).rejects.toThrow("bad return from module registry");
  });
});
