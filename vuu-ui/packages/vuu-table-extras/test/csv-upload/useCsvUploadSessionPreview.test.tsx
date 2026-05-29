import { createRoot } from "react-dom/client";
import { act, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { CsvUploadSessionTable } from "../../src/csv-upload";
import {
  type UseCsvUploadSessionPreviewReturn,
  useCsvUploadSessionPreview,
} from "../../src/csv-upload/useCsvUploadSessionPreview";

const useDataMock = vi.fn();

const actEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

vi.mock("@vuu-ui/vuu-utils", () => ({
  useData: () => useDataMock(),
}));

const sessionTable: CsvUploadSessionTable = {
  module: "SIMUL",
  table: "session-table",
};

class MockVuuDataSource {
  constructor(public args: unknown) {}
}

const Probe = ({
  onResult,
  sessionTable: activeSessionTable,
}: {
  onResult: (result: UseCsvUploadSessionPreviewReturn) => void;
  sessionTable: CsvUploadSessionTable | undefined;
}) => {
  const result = useCsvUploadSessionPreview(activeSessionTable);

  useEffect(() => {
    onResult(result);
  }, [onResult, result]);

  return null;
};

const createContainer = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("useCsvUploadSessionPreview", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = createContainer();
    root = createRoot(container);
    useDataMock.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("loads schema and builds a preview data source for the active session table", async () => {
    const getTableSchema = vi.fn().mockResolvedValue({
      key: "id",
      columns: [
        { name: "id", serverDataType: "string" },
        { name: "errorMap", serverDataType: "string" },
      ],
      table: sessionTable,
    } satisfies TableSchema);
    const getServerAPI = vi.fn().mockResolvedValue({ getTableSchema });
    useDataMock.mockReturnValue({
      VuuDataSource: MockVuuDataSource,
      getServerAPI,
    });

    let latestResult: UseCsvUploadSessionPreviewReturn | undefined;

    await act(async () => {
      root.render(
        <Probe
          onResult={(result) => {
            latestResult = result;
          }}
          sessionTable={sessionTable}
        />,
      );
      await tick();
      await tick();
    });

    expect(getServerAPI).toHaveBeenCalledTimes(1);
    expect(getTableSchema).toHaveBeenCalledWith(sessionTable);
    expect(latestResult?.isLoadingPreview).toBe(false);
    expect(latestResult?.previewError).toBeUndefined();
    expect(latestResult?.previewConfig?.columns).toEqual([
      { name: "id", serverDataType: "string" },
      {
        name: "errorMap",
        serverDataType: "string",
        width: 300,
        label: "Error Map",
      },
    ]);
    expect(latestResult?.previewDataSource).toBeInstanceOf(MockVuuDataSource);
    expect(
      (latestResult?.previewDataSource as MockVuuDataSource | undefined)?.args,
    ).toEqual({
      columns: ["id", "errorMap"],
      table: sessionTable,
    });
  });

  it("reports a preview error when schema loading fails", async () => {
    const getServerAPI = vi.fn().mockResolvedValue({
      getTableSchema: vi.fn().mockRejectedValue(new Error("boom")),
    });
    useDataMock.mockReturnValue({
      VuuDataSource: MockVuuDataSource,
      getServerAPI,
    });

    let latestResult: UseCsvUploadSessionPreviewReturn | undefined;

    await act(async () => {
      root.render(
        <Probe
          onResult={(result) => {
            latestResult = result;
          }}
          sessionTable={sessionTable}
        />,
      );
      await tick();
      await tick();
    });

    expect(latestResult?.previewDataSource).toBeUndefined();
    expect(latestResult?.previewConfig).toBeUndefined();
    expect(latestResult?.previewError).toContain("boom");
  });

  it("clears preview state when the session table is removed", async () => {
    const getTableSchema = vi.fn().mockResolvedValue({
      key: "id",
      columns: [{ name: "id", serverDataType: "string" }],
      table: sessionTable,
    } satisfies TableSchema);
    const getServerAPI = vi.fn().mockResolvedValue({ getTableSchema });
    useDataMock.mockReturnValue({
      VuuDataSource: MockVuuDataSource,
      getServerAPI,
    });

    let latestResult: UseCsvUploadSessionPreviewReturn | undefined;

    await act(async () => {
      root.render(
        <Probe
          onResult={(result) => {
            latestResult = result;
          }}
          sessionTable={sessionTable}
        />,
      );
      await tick();
      await tick();
    });

    expect(latestResult?.previewDataSource).toBeInstanceOf(MockVuuDataSource);

    await act(async () => {
      root.render(
        <Probe
          onResult={(result) => {
            latestResult = result;
          }}
          sessionTable={undefined}
        />,
      );
      await tick();
    });

    expect(latestResult?.previewDataSource).toBeUndefined();
    expect(latestResult?.previewConfig).toBeUndefined();
    expect(latestResult?.previewError).toBeUndefined();
    expect(latestResult?.isLoadingPreview).toBe(false);
  });

  it("reports a preview error when getServerAPI itself rejects", async () => {
    useDataMock.mockReturnValue({
      VuuDataSource: MockVuuDataSource,
      getServerAPI: vi.fn().mockRejectedValue(new Error("no server")),
    });

    let latestResult: UseCsvUploadSessionPreviewReturn | undefined;

    await act(async () => {
      root.render(
        <Probe
          onResult={(result) => {
            latestResult = result;
          }}
          sessionTable={sessionTable}
        />,
      );
      await tick();
      await tick();
    });

    expect(latestResult?.previewDataSource).toBeUndefined();
    expect(latestResult?.previewConfig).toBeUndefined();
    expect(latestResult?.previewError).toContain("no server");
    expect(latestResult?.isLoadingPreview).toBe(false);
  });

  it("does not update state after unmounting while schema load is in flight", async () => {
    let resolveSchema!: (schema: unknown) => void;
    const schemaPromise = new Promise((resolve) => {
      resolveSchema = resolve;
    });
    const getServerAPI = vi.fn().mockResolvedValue({
      getTableSchema: vi.fn().mockReturnValue(schemaPromise),
    });
    useDataMock.mockReturnValue({
      VuuDataSource: MockVuuDataSource,
      getServerAPI,
    });

    let latestResult: UseCsvUploadSessionPreviewReturn | undefined;

    // Mount and start loading
    await act(async () => {
      root.render(
        <Probe
          onResult={(result) => {
            latestResult = result;
          }}
          sessionTable={sessionTable}
        />,
      );
      await tick();
    });

    expect(latestResult?.isLoadingPreview).toBe(true);

    // Unmount before schema resolves
    await act(async () => {
      root.unmount();
    });

    // Now resolve the schema — should NOT cause a state update / error
    await act(async () => {
      resolveSchema({
        key: "id",
        columns: [{ name: "id", serverDataType: "string" }],
        table: sessionTable,
      });
      await tick();
    });

    // Result was last captured before unmount — still shows loading, no data
    expect(latestResult?.previewDataSource).toBeUndefined();
  });
});

