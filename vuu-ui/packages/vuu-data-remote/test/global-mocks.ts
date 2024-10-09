/* eslint-disable @typescript-eslint/ban-ts-comment */
import { vi } from "vitest";

const BlobMock = vi.fn(() => ({}));
const URLMock = {
  createObjectURL: () => ({}),
};
vi.stubGlobal("Blob", BlobMock);
vi.stubGlobal("URL", URLMock);
vi.stubGlobal("loggingSettings", { loggingLevel: "error" });

vi.mock("./inlined-worker", async () => ({
  workerSourceCode: "",
}));
