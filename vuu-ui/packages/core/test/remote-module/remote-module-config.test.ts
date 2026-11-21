import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetRemoteModuleConfig,
  loadRemoteModuleConfig,
  parseRemoteModuleConfig,
  RemoteModuleConfigError,
  remoteModuleConfigUrl,
} from "../../src/remote-module/remote-module-config";

const URL = "http://remote/config.json";

describe("remoteModuleConfigUrl", () => {
  it("resolves config.json beside the remote's manifest", () => {
    expect(remoteModuleConfigUrl("http://remote:5006")).toBe(
      "http://remote:5006/config.json",
    );
    expect(remoteModuleConfigUrl("http://remote/basket-trading//")).toBe(
      "http://remote/basket-trading/config.json",
    );
  });
});

describe("parseRemoteModuleConfig", () => {
  it("accepts an empty config from a remote with no Vuu server", () => {
    expect(parseRemoteModuleConfig({}, URL)).toEqual({});
  });

  it("reads a Vuu server connection", () => {
    expect(
      parseRemoteModuleConfig(
        {
          connectionId: "basket",
          restUrl: "https://vuu:8445/api/authn",
          websocketUrl: "wss://vuu:8093/websocket",
        },
        URL,
      ),
    ).toEqual({
      vuu: {
        connectionId: "basket",
        restUrl: "https://vuu:8445/api/authn",
        websocketUrl: "wss://vuu:8093/websocket",
      },
    });
  });

  it("accepts a connectionId alone, for local and portal servers", () => {
    expect(parseRemoteModuleConfig({ connectionId: "simul" }, URL)).toEqual({
      vuu: { connectionId: "simul" },
    });
  });

  it("ignores unrelated keys", () => {
    expect(parseRemoteModuleConfig({ theme: "dark" }, URL)).toEqual({});
  });

  it.each([
    [[], "must be a JSON object"],
    [null, "must be a JSON object"],
    [{ connectionId: "" }, "connectionId must be a non-empty string"],
    [{ connectionId: 42 }, "connectionId must be a non-empty string"],
    [
      { restUrl: "https://vuu/api/authn", websocketUrl: "wss://vuu/ws" },
      "connectionId is required when restUrl or websocketUrl is set",
    ],
    [
      { connectionId: "basket", restUrl: "https://vuu/api/authn" },
      "restUrl and websocketUrl must be set together",
    ],
  ])("rejects %j", (json, message) => {
    expect(() => parseRemoteModuleConfig(json, URL)).toThrow(
      new RemoteModuleConfigError(URL, message),
    );
  });
});

describe("loadRemoteModuleConfig", () => {
  let sequence = 0;
  let mfUrl: string;
  const fetchMock = vi.fn<(url: string) => Promise<Response>>();

  beforeEach(() => {
    // Configs are cached by URL.
    mfUrl = `http://remote-${sequence++}`;
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches each remote's config once", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ connectionId: "simul" })),
    );

    const first = loadRemoteModuleConfig(mfUrl);
    expect(loadRemoteModuleConfig(mfUrl)).toBe(first);
    await expect(first).resolves.toEqual({ vuu: { connectionId: "simul" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${mfUrl}/config.json`);
  });

  it.each([
    [
      "the request fails",
      () => Promise.reject(Error("offline")),
      "could not be fetched",
    ],
    [
      "the server responds with an error",
      async () => new Response("", { status: 404 }),
      "request failed with status 404",
    ],
    [
      "the file is missing and index.html is served",
      async () => new Response("<!doctype html>"),
      "is not valid JSON",
    ],
    [
      "the config is invalid",
      async () => new Response(JSON.stringify({ connectionId: "" })),
      "connectionId must be a non-empty string",
    ],
  ])("rejects when %s, and retries on the next load", async (_, respond, message) => {
    fetchMock.mockImplementationOnce(respond);
    await expect(loadRemoteModuleConfig(mfUrl)).rejects.toMatchObject({
      message: expect.stringContaining(message),
      name: "RemoteModuleConfigError",
      url: `${mfUrl}/config.json`,
    });

    fetchMock.mockResolvedValueOnce(new Response("{}"));
    await expect(loadRemoteModuleConfig(mfUrl)).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reloads a config that has been forgotten", async () => {
    fetchMock.mockImplementation(async () => new Response("{}"));
    await loadRemoteModuleConfig(mfUrl);
    forgetRemoteModuleConfig(mfUrl);
    await loadRemoteModuleConfig(mfUrl);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
