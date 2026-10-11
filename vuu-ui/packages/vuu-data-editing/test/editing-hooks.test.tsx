import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EditSession,
  getEditableColumns,
  UNDO_COLUMN,
  useAsyncValidation,
  useCustomEditField,
  useEditForm,
  useEntityDraft,
  type EditFormHookProps,
} from "../src";

vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal("Worker", MockWorker);
});

const SUCCESS = { data: undefined, type: "SUCCESS_RESULT" as const };

const createDataSource = () => {
  const dataSource = {
    addRow: vi.fn().mockResolvedValue(SUCCESS),
    createSessionDataSource: vi.fn(async () => dataSource),
    editCell: vi.fn().mockResolvedValue(SUCCESS),
    endEditSession: vi.fn().mockResolvedValue(undefined),
    status: "subscribed",
  };
  return dataSource as typeof dataSource & DataSource;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("getEditableColumns", () => {
  const columns: ColumnDescriptor[] = [
    { name: "ric", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    { name: "vuuCreatedTimestamp", serverDataType: "long" },
    { name: "selected", source: "client" } as ColumnDescriptor,
  ];

  it("returns columns unchanged when not editing", () => {
    expect(getEditableColumns({ columns, isEditing: false })).toBe(columns);
  });

  it("makes server columns editable, except read-only and client columns", () => {
    const result = getEditableColumns({ columns, isEditing: true });
    expect(result.map((c) => [c.name, c.editable])).toEqual([
      ["ric", true],
      ["price", true],
      ["vuuCreatedTimestamp", undefined],
      ["selected", undefined],
    ]);
  });

  it("applies per-column config and wildcard", () => {
    const result = getEditableColumns({
      columns: columns.slice(0, 2),
      editable: {
        "*": true,
        ric: { insert: true, update: false },
      },
      isEditing: true,
    });
    expect(result[0].editable).toEqual({ insert: true, update: false });
    expect(result[1].editable).toBe(true);
  });

  it("leaves unlisted columns as-is when config has no wildcard", () => {
    const result = getEditableColumns({
      columns: columns.slice(0, 2),
      editable: { price: { renderer: "dropdown-cell", values: ["1", "2"] } },
      isEditing: true,
    });
    expect(result[0]).toBe(columns[0]);
    expect(result[1]).toMatchObject({
      editable: true,
      type: {
        name: "string",
        renderer: { name: "dropdown-cell", values: ["1", "2"] },
      },
    });
  });

  it("appends action and undo columns", () => {
    const result = getEditableColumns({
      actionColumn: "hidden",
      columns: columns.slice(0, 1),
      isEditing: true,
      undoColumn: { width: 60 },
    });
    expect(result.map((c) => c.name)).toEqual(["ric", "vuuAction", "undo"]);
    expect(result[1].hidden).toBe(true);
    expect(result[2]).toEqual({ ...UNDO_COLUMN, width: 60 });
  });

  it("builds columns from the edit schema when columns diverge", () => {
    const result = getEditableColumns({
      columns: [{ label: "RIC", name: "ric", serverDataType: "string" }],
      columnsDiverge: true,
      editSchema: {
        columns: [
          { name: "ric", serverDataType: "string" },
          { name: "qty", serverDataType: "int" },
          { name: "vuuAction", serverDataType: "string" },
        ],
        key: "ric",
        table: { module: "TEST", table: "session" },
      },
      isEditing: true,
    });
    expect(result.map((c) => [c.name, c.label])).toEqual([
      ["ric", "RIC"],
      ["qty", undefined],
    ]);
  });
});

describe("editing hooks", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderHook = async <P, R>(hook: (props: P) => R, props: P) => {
    const result: { current: R } = { current: undefined as R };
    const Probe = (p: { hookProps: P }) => {
      result.current = hook(p.hookProps);
      return null;
    };
    await act(async () => root.render(<Probe hookProps={props} />));
    await act(flush);
    return {
      result,
      rerender: (next: P) =>
        act(async () => root.render(<Probe hookProps={next} />)),
    };
  };

  describe("useEditForm", () => {
    it("edit mode begins a Selected session and saves", async () => {
      const dataSource = createDataSource();
      const onSaved = vi.fn();
      const props: EditFormHookProps = {
        dataRow: { key: "k1", price: 1 } as never,
        dataSource,
        isEditMode: true,
        onSaved,
      };
      const { result } = await renderHook(useEditForm, props);
      expect(dataSource.createSessionDataSource).toHaveBeenCalledWith(
        "Selected",
        "edit",
      );
      expect(result.current.isActive).toBe(true);
      expect(result.current.canSave).toBe(false);

      await act(async () => {
        await result.current.editSession.commit("k1", "price", 1, 2, true);
      });
      expect(result.current.getValues()).toMatchObject({ key: "k1", price: 2 });
      expect(result.current.canSave).toBe(true);

      let saved = false;
      await act(async () => {
        saved = await result.current.submit();
      });
      expect(saved).toBe(true);
      expect(dataSource.endEditSession).toHaveBeenCalledWith(true, false);
      expect(onSaved).toHaveBeenCalled();
    });

    it("validation errors block save", async () => {
      const dataSource = createDataSource();
      const { result } = await renderHook(useEditForm, {
        dataRow: { key: "k1", price: -1 } as never,
        dataSource,
        isEditMode: true,
        validate: (values) =>
          (values.price as number) < 0 ? { price: "Must be positive" } : {},
      });
      let saved = true;
      await act(async () => {
        saved = await result.current.submit();
      });
      expect(saved).toBe(false);
      expect(result.current.fieldErrors).toEqual({ price: "Must be positive" });
      expect(dataSource.endEditSession).not.toHaveBeenCalled();
    });

    it("create mode adds a new row once required values are set", async () => {
      const dataSource = createDataSource();
      const onSaved = vi.fn();
      const columns = ["ric", "price"];
      const { result } = await renderHook(useEditForm, {
        columns,
        dataSource,
        mode: "create",
        onSaved,
      });
      expect(dataSource.createSessionDataSource).toHaveBeenCalledWith(
        "Empty",
        "edit",
      );
      expect(result.current.canSave).toBe(false);

      await act(async () => {
        result.current.setValue("ric", "AAPL.L");
        result.current.setValue("price", 100);
      });
      expect(result.current.canSave).toBe(true);
      expect(result.current.isDirty).toBe(true);

      await act(async () => {
        await result.current.submit();
      });
      expect(dataSource.addRow).toHaveBeenCalledWith({
        price: 100,
        ric: "AAPL.L",
      });
      expect(dataSource.endEditSession).toHaveBeenCalledWith(true, false);
      expect(onSaved).toHaveBeenCalled();
    });

    it("create mode reports RPC errors and does not end the session", async () => {
      const dataSource = createDataSource();
      dataSource.addRow.mockResolvedValue({
        errorMessage: "duplicate key",
        type: "ERROR_RESULT",
      });
      const { result } = await renderHook(useEditForm, {
        columns: ["ric"],
        dataSource,
        mode: "create",
      });
      await act(async () => result.current.setValue("ric", "AAPL.L"));
      let saved = true;
      await act(async () => {
        saved = await result.current.submit();
      });
      expect(saved).toBe(false);
      expect(result.current.error?.message).toBe("duplicate key");
      expect(dataSource.endEditSession).not.toHaveBeenCalled();
    });

    it("cancel ends the session without saving", async () => {
      const dataSource = createDataSource();
      const onCancelled = vi.fn();
      const { result } = await renderHook(useEditForm, {
        dataSource,
        isEditMode: true,
        onCancelled,
      });
      await act(async () => result.current.cancel());
      expect(dataSource.endEditSession).toHaveBeenCalledWith(false, false);
      expect(onCancelled).toHaveBeenCalled();
    });
  });

  describe("useCustomEditField", () => {
    it("commits serialized values and reverts to the original", async () => {
      const dataSource = createDataSource();
      const editSession = new EditSession({ dataSource });
      await editSession.begin();
      const serialize = (v: string[]) => v.join(",");
      const equals = (a: string[], b: string[]) => a.join() === b.join();
      const original = ["a"];
      const { result } = await renderHook(useCustomEditField<string[]>, {
        editSession,
        equals,
        name: "tags",
        originalValue: original,
        rowKey: "k1",
        serialize,
      });

      await act(async () => result.current.setValue(["a", "b"]));
      expect(dataSource.editCell).toHaveBeenLastCalledWith("k1", "tags", "a,b");
      expect(result.current.isDirty).toBe(true);
      expect(editSession.isDirty).toBe(true);

      await act(async () => result.current.setValue(["a"]));
      expect(result.current.value).toBe(original);
      expect(result.current.isDirty).toBe(false);
      expect(editSession.isDirty).toBe(false);
    });
  });

  describe("useEntityDraft", () => {
    it("tracks changes, shows errors after touch, and submits changes", async () => {
      const onSubmit = vi.fn();
      const initialValues = { email: "a@b.com", name: "Ann" };
      const { result } = await renderHook(
        useEntityDraft<typeof initialValues>,
        {
          initialValues,
          onSubmit,
          validate: (v) => (v.name ? {} : { name: "Required" }),
        },
      );
      expect(result.current.isDirty).toBe(false);

      await act(async () => result.current.setValue("name", ""));
      expect(result.current.errors).toEqual({ name: "Required" });
      expect(result.current.isValid).toBe(false);

      await act(async () => result.current.setValue("name", "Bob"));
      expect(result.current.changes).toEqual({ name: "Bob" });

      let ok = false;
      await act(async () => {
        ok = await result.current.submit();
      });
      expect(ok).toBe(true);
      expect(onSubmit).toHaveBeenCalledWith(
        { email: "a@b.com", name: "Bob" },
        { name: "Bob" },
      );

      await act(async () => result.current.reset());
      expect(result.current.values).toBe(initialValues);
    });

    it("captures submit errors", async () => {
      const { result } = await renderHook(useEntityDraft<{ name: string }>, {
        initialValues: { name: "Ann" },
        onSubmit: () => Promise.reject(new Error("rpc failed")),
      });
      let ok = true;
      await act(async () => {
        ok = await result.current.submit();
      });
      expect(ok).toBe(false);
      expect(result.current.submitError?.message).toBe("rpc failed");
    });
  });

  describe("useAsyncValidation", () => {
    it("caches results and ignores superseded calls", async () => {
      const validator = vi.fn(async (value: string) =>
        value === "taken" ? "Name is taken" : undefined,
      );
      const { result } = await renderHook(useAsyncValidation<string>, {
        debounceMs: 0,
        validator,
      });

      let error: string | undefined;
      await act(async () => {
        error = await result.current.validate("taken");
      });
      expect(error).toBe("Name is taken");
      expect(result.current.status).toBe("invalid");

      await act(async () => {
        error = await result.current.validate("taken");
      });
      expect(validator).toHaveBeenCalledTimes(1);

      let first: Promise<string | undefined> = Promise.resolve(undefined);
      await act(async () => {
        first = result.current.validate("x", { immediate: false });
        await result.current.validate("free");
      });
      expect(await first).toBeUndefined();
      expect(result.current.status).toBe("valid");
    });

    it("debounces calls", async () => {
      const validator = vi.fn(async () => undefined);
      const { result } = await renderHook(useAsyncValidation<string>, {
        debounceMs: 100,
        validator,
      });
      vi.useFakeTimers();
      try {
        act(() => {
          result.current.validate("a");
          result.current.validate("ab");
          result.current.validate("abc");
        });
        expect(result.current.status).toBe("validating");
        await act(async () => {
          await vi.advanceTimersByTimeAsync(100);
        });
        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator).toHaveBeenCalledWith("abc", expect.anything());
        expect(result.current.status).toBe("valid");
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
