/* eslint-disable @typescript-eslint/ban-ts-comment */
import { vi } from "vitest";

export let resolveServerAPI;

vi.mock("../src/connection-manager", async () => {
  const actual = await vi.importActual("../src/connection-manager");
  return {
    // @ts-ignore
    ...actual,
    serverAPI: new Promise((resolve) => {
      resolveServerAPI = resolve;
    }),
  };
});
