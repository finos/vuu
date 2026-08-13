import { createRoot } from "react-dom/client";
import { act, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { EditSession } from "@vuu-ui/vuu-data-editing";
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

const sessionDataSources = new WeakMap<DataSource, DataSource>();

const makeDataSource = (overrides: Partial<DataSource> = {}): DataSource => {
  const sessionDataSource = {
    addRow: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    endEditSession: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    table: sessionTable,
  } as unknown as DataSource;
  const dataSource = {
    table: vuuTable,
    tableSchema: schema,
    columns: ["id", "label", "count"],
    createSessionDataSource: vi.fn().mockResolvedValue(sessionDataSource),
    endEditSession: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    rpcRequest: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
    ...overrides,
  } as unknown as DataSource;
  sessionDataSources.set(dataSource, sessionDataSource);
  return dataSource;
};

const getSessionDataSource = (dataSource: DataSource): DataSource => {
  const sessionDataSource = sessionDataSources.get(dataSource);
  if (sessionDataSource === undefined) {
    throw Error("No test session datasource");
  }
  return sessionDataSource;
};

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

const getAddRowPayloads = (dataSource: DataSource): Record<string, unknown>[] =>
  (
    getSessionDataSource(dataSource).addRow as ReturnType<typeof vi.fn>
  ).mock.calls.map((call: unknown[]) => call[0] as Record<string, unknown>);

const dropFile = async (
  result: UseCsvUploadReturn | undefined,
  content: string,
) => {
  await act(async () => {
    result?.onDrop({} as React.DragEvent<HTMLDivElement>, [makeFile(content)]);
    await tick();
    await tick();
  });
};

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

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(true);
    expect(latestResult?.validation?.errors).toHaveLength(0);
    expect(dataSource.createSessionDataSource).toHaveBeenCalledWith("Empty");
    expect(getSessionDataSource(dataSource).addRow).toHaveBeenCalled();
    expect(dataSource.rpcRequest).not.toHaveBeenCalled();
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

    await dropFile(latestResult, "id;label;count\na1;foo;10");

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

    await dropFile(latestResult, '"label","count"\n"foo","10"');

    expect(latestResult?.canImport).toBe(false);
    expect(dataSource.createSessionDataSource).not.toHaveBeenCalled();
    const schemaErrorCall = onError.mock.calls
      .map((c) => c[0])
      .filter(Boolean)
      .at(-1);
    expect(schemaErrorCall?.errors.schemaError).toBeDefined();
  });

  it("fires onImportSessionStarted with the session datasource when a valid CSV is processed", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onImportSessionStarted = vi.fn();
    const mockSessionDs = {
      addRow: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
      endEditSession: vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" }),
      table: sessionTable,
    } as unknown as DataSource;
    const dataSource = makeDataSource({
      createSessionDataSource: vi.fn().mockResolvedValue(mockSessionDs),
    });

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onImportSessionStarted }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(onImportSessionStarted).toHaveBeenCalledWith(mockSessionDs);
  });

  it("calls endEditSession(true) and fires onImported when importData succeeds", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onImported = vi.fn();
    const onImportSessionEnded = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onImported, onImportSessionEnded }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(true);

    let importSucceeded: boolean | undefined;
    await act(async () => {
      importSucceeded = await latestResult?.importData();
      await tick();
    });

    expect(importSucceeded).toBe(true);
    expect(
      getSessionDataSource(dataSource).endEditSession,
    ).toHaveBeenCalledWith(true, false);
    expect(dataSource.endEditSession).not.toHaveBeenCalled();
    expect(onImported).toHaveBeenCalled();
    const endedResult: CsvUploadSessionEndResult =
      onImportSessionEnded.mock.calls[0][0];
    expect(endedResult.reason).toBe("saved");
  });

  it("returns the populated edit session without committing it in preview mode", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onPreview = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, importMode: "preview", onPreview }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(true);
    expect(dataSource.createSessionDataSource).toHaveBeenCalledWith("Empty");
    expect(getSessionDataSource(dataSource).addRow).toHaveBeenCalledWith({
      count: 10,
      id: "a1",
      label: "foo",
      rowNum: 2,
      vuuMsg: "",
    });
    expect(dataSource.rpcRequest).not.toHaveBeenCalled();

    let importSucceeded: boolean | undefined;
    await act(async () => {
      importSucceeded = await latestResult?.importData();
      await tick();
    });

    expect(importSucceeded).toBe(true);
    expect(
      getSessionDataSource(dataSource).endEditSession,
    ).not.toHaveBeenCalled();
    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource: getSessionDataSource(dataSource),
        editSession: expect.any(EditSession),
        tableData: {
          columns: ["id", "label", "count"],
          rows: [["a1", "foo", 10]],
        },
      }),
    );
  });

  it("discards the session and disables Import when adding a row fails", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource();
    vi.mocked(getSessionDataSource(dataSource).addRow).mockResolvedValue({
      errorMessage: "insert failed",
      type: "ERROR_RESULT",
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

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(false);
    expect(
      getSessionDataSource(dataSource).endEditSession,
    ).toHaveBeenCalledWith(false, false);
    expect(onError.mock.calls.at(-1)?.[0]?.errors.importError).toBeDefined();
  });

  it("does not start a session when cancelled while reading a file", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const dataSource = makeDataSource();
    let resolveFile: ((value: string) => void) | undefined;
    const file = {
      text: () =>
        new Promise<string>((resolve) => {
          resolveFile = resolve;
        }),
    } as File;

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
      latestResult?.onDrop({} as React.DragEvent<HTMLDivElement>, [file]);
      await tick();
    });
    const cancelPromise = latestResult?.cancelImport();
    resolveFile?.('"id","label","count"\n"a1","foo","10"');
    await act(async () => {
      await cancelPromise;
      await tick();
    });

    expect(dataSource.createSessionDataSource).not.toHaveBeenCalled();
  });

  it("discards the session and emits importError when endEditSession rejects", async () => {
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

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(true);

    (
      getSessionDataSource(dataSource) as unknown as Record<string, unknown>
    ).endEditSession = vi.fn().mockRejectedValue(new Error("server error"));

    let importSucceeded: boolean | undefined;
    await act(async () => {
      importSucceeded = await latestResult?.importData();
      await tick();
    });

    expect(importSucceeded).toBe(false);
    expect(onError).toHaveBeenCalled();
    const errorResult = onError.mock.calls.at(-1)?.[0];
    expect(errorResult?.errors.importError).toBeDefined();
    (
      getSessionDataSource(dataSource) as unknown as Record<string, unknown>
    ).endEditSession = vi.fn().mockResolvedValue({ type: "SUCCESS_RESULT" });
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

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.sessionTable).toEqual(sessionTable);

    await dropFile(latestResult, '"id","label","count"\n"a2","bar","20"');

    expect(
      getSessionDataSource(dataSource).endEditSession,
    ).toHaveBeenCalledWith(false, false);
    expect(dataSource.endEditSession).not.toHaveBeenCalled();
  });

  it("emits an error when dataSource.createSessionDataSource is not defined", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource({ createSessionDataSource: undefined });

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

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(onError).toHaveBeenCalled();
  });

  it("emits an importError when endEditSession is not defined and importData is called", async () => {
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

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(true);
    (
      getSessionDataSource(dataSource) as unknown as Record<string, unknown>
    ).endEditSession = undefined;

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

    await dropFile(
      latestResult,
      '"id","label","count"\n"a1","foo","NOT_A_NUMBER"',
    );

    expect(dataSource.createSessionDataSource).toHaveBeenCalledWith("Empty");
    expect(latestResult?.canImport).toBe(false);
    expect(latestResult?.validation?.errors.length).toBeGreaterThan(0);

    const addRowCalls = getAddRowPayloads(dataSource);
    expect(addRowCalls).toHaveLength(1);
    expect(addRowCalls[0]).toHaveProperty("id");
    expect(addRowCalls[0]).toHaveProperty("label");
    expect(addRowCalls[0]).toHaveProperty("rowNum");
    expect(typeof addRowCalls[0].vuuMsg).toBe("string");
    expect(addRowCalls[0].vuuMsg as string).toMatch(/^Row \d+:/);
    expect(addRowCalls[0].vuuMsg as string).toContain("count");
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

    await dropFile(
      latestResult,
      '"id","label","count"\n"a1","foo","10"\n"a2","bar","NOT_A_NUMBER"',
    );

    const addRowCalls = getAddRowPayloads(dataSource);

    expect(addRowCalls).toHaveLength(2);

    const validPayload = addRowCalls.find((p) => p.vuuMsg === "");
    expect(validPayload).toBeDefined();
    expect(validPayload).toHaveProperty("id", "a1");
    expect(validPayload).toHaveProperty("label", "foo");

    const errorPayload = addRowCalls.find((p) => (p.vuuMsg as string) !== "");
    expect(errorPayload).toBeDefined();
    expect(errorPayload).toHaveProperty("id", "a2");
    expect(errorPayload).toHaveProperty("label", "bar");
    expect(errorPayload?.vuuMsg as string).toMatch(/^Row \d+:.*count/);
  });

  it("fires onImportSessionEnded with reason 'discarded' when a second file replaces the first", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onImportSessionEnded = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onImportSessionEnded }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    await dropFile(latestResult, '"id","label","count"\n"a2","bar","20"');

    const discardedCall = onImportSessionEnded.mock.calls
      .map((c: unknown[]) => c[0] as CsvUploadSessionEndResult)
      .find((r) => r.reason === "discarded");
    expect(discardedCall).toBeDefined();
  });

  it("fires onProcessingStarted when a file is dropped", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onProcessingStarted = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onProcessingStarted }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await dropFile(latestResult, '"id","label","count"\n"a1","foo","10"');

    expect(onProcessingStarted).toHaveBeenCalledTimes(1);
  });

  it("emits a schema error and does not start a session when maxRows is exceeded", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{ dataSource, onError, maxRows: 1 }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    await dropFile(
      latestResult,
      '"id","label","count"\n"a1","foo","10"\n"a2","bar","20"',
    );

    expect(latestResult?.canImport).toBe(false);
    expect(dataSource.createSessionDataSource).not.toHaveBeenCalled();
    expect(onError.mock.calls.at(-1)?.[0]?.errors.schemaError).toBeDefined();
  });

  it("formats vuuMsg as 'Row N: column: message' for a single row error", async () => {
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

    await dropFile(
      latestResult,
      '"id","label","count"\n"a1","foo","NOT_A_NUMBER"',
    );

    const payload = getAddRowPayloads(dataSource).find((p) => p.vuuMsg !== "");

    expect(payload?.vuuMsg).toMatch(/^Row 2: count:/);
  });

  it("joins multiple column errors on the same row in vuuMsg with '; '", async () => {
    const multiNumericSchema: TableSchema = {
      key: "id",
      columns: [
        { name: "id", serverDataType: "string" },
        { name: "price", serverDataType: "double" },
        { name: "quantity", serverDataType: "int" },
      ],
      table: { module: "TEST", table: "items" },
    } as unknown as TableSchema;
    const dataSource = makeDataSource({ tableSchema: multiNumericSchema });

    let latestResult: UseCsvUploadReturn | undefined;

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

    await dropFile(
      latestResult,
      '"id","price","quantity"\n"a1","BAD_PRICE","BAD_QTY"',
    );

    const payload = getAddRowPayloads(dataSource).find((p) => p.vuuMsg !== "");

    expect(payload?.vuuMsg).toMatch(/^Row 2: price:.*; quantity:/);
  });

  it("assigns the correct row number in vuuMsg when multiple rows have errors", async () => {
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

    await dropFile(
      latestResult,
      '"id","label","count"\n"a1","foo","10"\n"a2","bar","BAD"\n"a3","baz","ALSO_BAD"',
    );

    const payloads = getAddRowPayloads(dataSource);

    expect(payloads).toHaveLength(3);

    expect(payloads.find((p) => p.id === "a1")?.vuuMsg).toBe("");
    expect(payloads.find((p) => p.id === "a2")?.vuuMsg).toMatch(
      /^Row 3: count:/,
    );
    expect(payloads.find((p) => p.id === "a3")?.vuuMsg).toMatch(
      /^Row 4: count:/,
    );
  });

  it("respects parseOptions.requireQuotedValues and emits a validationError for an unquoted CSV", async () => {
    let latestResult: UseCsvUploadReturn | undefined;
    const onError = vi.fn();
    const dataSource = makeDataSource();

    await act(async () => {
      root.render(
        <Probe
          props={{
            dataSource,
            onError,
            parseOptions: { requireQuotedValues: true },
          }}
          onResult={(r) => {
            latestResult = r;
          }}
        />,
      );
      await tick();
    });

    // Unquoted header triggers a file-level UNQUOTED_VALUE parse error
    await dropFile(latestResult, 'id,label,count\n"a1","foo","10"');

    expect(latestResult?.canImport).toBe(false);
    expect(dataSource.createSessionDataSource).not.toHaveBeenCalled();
    expect(
      onError.mock.calls.at(-1)?.[0]?.errors.validationError,
    ).toBeDefined();
  });
});
