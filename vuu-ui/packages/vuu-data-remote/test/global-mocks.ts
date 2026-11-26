/* eslint-disable @typescript-eslint/ban-ts-comment */
import { vi } from "vitest";

const BlobMock = vi.fn(class {});
vi.stubGlobal("Blob", BlobMock);
vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
vi.stubGlobal("loggingSettings", { loggingLevel: "error" });

vi.mock("./inlined-worker", async () => ({
  workerSourceCode: "",
}));
