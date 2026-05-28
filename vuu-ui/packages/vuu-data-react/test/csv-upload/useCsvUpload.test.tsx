import { createRoot } from "react-dom/client";
import { act, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import {
  type CsvUploadHookProps,
  type UseCsvUploadReturn,
  useCsvUpload,
} from "../../src/csv-upload/useCsvUpload";
import type { CsvUploadSessionEndResult } from "../../src/csv-upload/CsvUpload";

vi.mock("@vuu-ui/vuu-utils", async () => {
  const actual =
    await vi.importActual<typeof import("@vuu-ui/vuu-utils")>(
      "@vuu-ui/vuu-utils",
    );
  return {
    ...actual,
    useData: () => ({}),
  };
});

const actEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const schema: TableSchema = {
  key: "id",
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "label", serverDataType: "string" },
    { name: "count", serverDataType: "int" },
  ],
  table: { module: "TEST", table: "items" },
} as unknown as TableSchema;

const vuuTable: VuuTable = { module: "TEST", table: "items" };
const sessionTable: VuuTable = { module: "TEST", table: "session-abc" };

const makeFile = (content: string, name = "test.csv"): File =>
  new File([content], name, { type: "text/csv" });

const makeDataSource = (overrides: Partial<DataSource> = {}): DataSource =>
  ({
    table: vuuTable,
    tableSchema: schema,
    columns: ["id", "label", "count"],
    beginEditSession: vi.fn().mockResolvedValue({ table: sessionTable }),
    endEditSession: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    rpcRequest: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    ...overrides,
  }) as unknown as DataSource;

const Probe = ({
  onResult,
  props,
}: {
  onResult: (result: UseCsvUploadReturn) => void;
  props: CsvUploadHookProps;
}) => {
  const result = useCsvUpload(props);
  useEffect(() => {
    onResult(result);
  }, [onResult, result]);
  return null;
};

const createContainer = () => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("useCsvUpload", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = createContainer();
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("returns canImport=false and no validation before any file is processed", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    expect(latestResult?.canImport).toBe(false);
    expect(latestResult?.validation).toBeUndefined();
    expect(latestResult?.isProcessingFile).toBe(false);
    expect(latestResult?.isImporting).toBe(false);
  });

  it("sets canImport=true after a fully valid CSV is processed", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.canImport).toBe(true);
    expect(latestResult?.validation?.errors).toHaveLength(0);
    expect(dataSource.beginEditSession).toHaveBeenCalledWith("csv-upload");
  });

  it("sets canImport=false and emits an error for a file-level parse error", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onError }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile("id;label;count\na1;foo;10"),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.canImport).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  it("sets canImport=false and reports schema error when key column is missing", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onError }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"label","count"\n"foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.canImport).toBe(false);
    expect(dataSource.beginEditSession).not.toHaveBeenCalled();
    const schemaErrorCall = onError.mock.calls
      .map((c) => c[0])
      .filter(Boolean)
      .at(-1);
    expect(schemaErrorCall?.errors.schemaError).toBeDefined();
  });

  it("fires onEditSessionStarted with the session datasource when a valid CSV is processed", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onEditSessionStarted = vi.fn();
    const mockSessionDs = {} as DataSource;
    const dataSource = makeDataSource({
      createSessionDataSource: vi.fn().mockReturnValue(mockSessionDs),
    });

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onEditSessionStarted }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(onEditSessionStarted).toHaveBeenCalledWith(mockSessionDs);
  });

  it("calls endEditSession(true) and fires onImported when importData succeeds", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onImported = vi.fn();
    const onEditSessionEnded = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onImported, onEditSessionEnded }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.canImport).toBe(true);

    await act(async () => {
      await latestResult?.importData();
      await tick();
    });

    expect(dataSource.endEditSession).toHaveBeenCalledWith(true);
    expect(onImported).toHaveBeenCalled();
    const endedResult: CsvUploadSessionEndResult =
      onEditSessionEnded.mock.calls[0][0];
    expect(endedResult.reason).toBe("saved");
  });

  it("discards the session and emits importError when endEditSession rejects", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource({
      endEditSession: vi.fn().mockRejectedValue(new Error("server error")),
    });

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onError }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    const goodEndEditSession = vi
      .fn()
      .mockResolvedValue({ type: "SUCCESS_RESULT" });
    (dataSource as unknown as Record<string, unknown>).endEditSession =
      goodEndEditSession;

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.canImport).toBe(true);

    (dataSource as unknown as Record<string, unknown>).endEditSession = vi
      .fn()
      .mockRejectedValue(new Error("server error"));

    await act(async () => {
      await latestResult?.importData();
      await tick();
    });

    expect(onError).toHaveBeenCalled();
    const errorResult = onError.mock.calls.at(-1)?.[0];
    expect(errorResult?.errors.importError).toBeDefined();
  });

  it("replaces a pending session when a second file is dropped", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.sessionTable).toEqual(sessionTable);

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a2","bar","20"'),
      ]);
      await tick();
      await tick();
    });

    expect(dataSource.endEditSession).toHaveBeenCalledWith(false);
  });

  it("emits an error when dataSource.beginEditSession is not defined", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource({ beginEditSession: undefined });

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onError }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(onError).toHaveBeenCalled();
  });

  it("emits an importError when endEditSession is not defined and importData is called", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource({ endEditSession: undefined });

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onError }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    expect(latestResult?.canImport).toBe(true);

    await act(async () => {
      await latestResult?.importData();
      await tick();
    });

    const importErrorCall = onError.mock.calls
      .map((c) => c[0])
      .filter(Boolean)
      .at(-1);
    expect(importErrorCall?.errors.importError).toBeDefined();
  });

  it("sets canImport=false but still starts a session when the CSV has row-level validation errors", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","NOT_A_NUMBER"'),
      ]);
      await tick();
      await tick();
    });

    expect(dataSource.beginEditSession).toHaveBeenCalledWith("csv-upload");
    expect(latestResult?.canImport).toBe(false);
    expect(latestResult?.validation?.errors.length).toBeGreaterThan(0);

    const addRowCalls = (
      dataSource.rpcRequest as ReturnType<typeof vi.fn>
    ).mock.calls.map(
      (c: unknown[]) =>
        (c[0] as { params: { rowData: Record<string, unknown> } }).params
          .rowData,
    );
    expect(addRowCalls).toHaveLength(1);
    expect(addRowCalls[0]).not.toHaveProperty("id");
    expect(addRowCalls[0]).not.toHaveProperty("label");
    expect(addRowCalls[0]).not.toHaveProperty("count");
    expect(addRowCalls[0]).toHaveProperty("rowNum");
    const errorMap = JSON.parse(addRowCalls[0].errorMap as string);
    expect(errorMap).toHaveProperty("count");
  });

  it("sends full row data for valid rows and omits it for error rows in the same file", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile(
          '"id","label","count"\n"a1","foo","10"\n"a2","bar","NOT_A_NUMBER"',
        ),
      ]);
      await tick();
      await tick();
    });

    const addRowCalls = (
      dataSource.rpcRequest as ReturnType<typeof vi.fn>
    ).mock.calls.map(
      (c: unknown[]) =>
        (c[0] as { params: { rowData: Record<string, unknown> } }).params
          .rowData,
    );

    expect(addRowCalls).toHaveLength(2);

    const validPayload = addRowCalls.find((p) => p.errorMap === "");
    expect(validPayload).toBeDefined();
    expect(validPayload).toHaveProperty("id", "a1");
    expect(validPayload).toHaveProperty("label", "foo");

    const errorPayload = addRowCalls.find((p) => p.errorMap !== "");
    expect(errorPayload).toBeDefined();
    expect(errorPayload).not.toHaveProperty("id");
    expect(errorPayload).not.toHaveProperty("label");
    expect(errorPayload).not.toHaveProperty("count");
    const errorMap = JSON.parse(errorPayload!.errorMap as string);
    expect(errorMap).toHaveProperty("count");
  });

  it("fires onEditSessionEnded with reason 'discarded' when a second file replaces the first", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onEditSessionEnded = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onEditSessionEnded }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a1","foo","10"'),
      ]);
      await tick();
      await tick();
    });

    await act(async () => {
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [
        makeFile('"id","label","count"\n"a2","bar","20"'),
      ]);
      await tick();
      await tick();
    });

    const discardedCall = onEditSessionEnded.mock.calls
      .map((c: unknown[]) => c[0] as CsvUploadSessionEndResult)
      .find((r) => r.reason === "discarded");
    expect(discardedCall).toBeDefined();
  });
});

