/* eslint-disable @typescript-eslint/ban-ts-comment */
import { vi } from "vitest";

const WorkerMock = vi.fn(() => ({}));
const BlobMock = vi.fn(() => ({}));
const URLMock = {
  createObjectURL: () => ({}),
};
vi.stubGlobal("Worker", WorkerMock);
vi.stubGlobal("Blob", BlobMock);
vi.stubGlobal("URL", URLMock);
vi.stubGlobal("loggingSettings", { loggingLevel: "error" });

vi.mock("@finos/vuu-utils", async () => {
  const actual = await vi.importActual("@finos/vuu-utils");
  return {
    // @ts-ignore
    ...actual,
    uuid: () => "uuid-1",
    getLocalEntity: <T>(url: string): T | undefined => {
      const data = localStorage.getItem(url);
      return data ? JSON.parse(data) : undefined;
    },
    saveLocalEntity: <T>(url: string, data: T): T | undefined => {
      try {
        localStorage.setItem(url, JSON.stringify(data));
        return data;
      } catch {
        return undefined;
      }
    },
  };
});
