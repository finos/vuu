import type { DataSource } from "@vuu-ui/vuu-data-types";
import { act, type ComponentProps, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  EditButtons,
  EditSession,
  StaleUpdateError,
  useCellEdited,
  useEditableTable,
} from "../src";
import { EventEmitter } from "@vuu-ui/vuu-utils";

vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(_url: string) {
      void _url;
    }

    postMessage(_message: unknown) {
      void _message;
    }

    terminate() {
      return undefined;
    }
  }

  vi.stubGlobal("Worker", MockWorker);
});

const SUCCESS = { data: undefined, type: "SUCCESS_RESULT" as const };

const createEditSession = () => {
  const dataSource: DataSource = {
    createSessionDataSource: vi.fn(
      async () => dataSource as unknown as DataSource,
    ),
    editCell: vi.fn().mockResolvedValue(SUCCESS),
    endEditSession: vi.fn(),
    undoRowChange: vi.fn().mockResolvedValue(SUCCESS),
  } as unknown as DataSource;
  return new EditSession({ dataSource: dataSource });
};

const CellMarker = ({
  columnName,
  editSession,
  rowKey,
}: {
  columnName: string;
  editSession: EditSession;
  rowKey: string;
}) => (
  <output data-edited={useCellEdited(editSession, rowKey, columnName)}>
    {rowKey}:{columnName}
  </output>
);

beforeAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = false;
});

const ToggleableEditButtons = ({
  editSession,
  onSave,
}: Pick<ComponentProps<typeof EditButtons>, "editSession" | "onSave">) => {
  const [mounted, setMounted] = useState(true);
  return (
    <>
      <button onClick={() => setMounted((value) => !value)} type="button">
        toggle
      </button>
      {mounted && (
        <EditButtons
          canCancel
          canSave
          editSession={editSession}
          onSave={onSave}
        />
      )}
    </>
  );
};

const EditableTableHarness = ({
  onCancel,
  onSave,
  sessionDataSource,
  sourceDataSource,
}: {
  onCancel: () => void;
  onSave: () => void;
  sessionDataSource: DataSource;
  sourceDataSource: DataSource;
}) => {
  const [isEditMode, setIsEditMode] = useState(true);
  const { dataSource, isEditSessionReady, lifecycle } = useEditableTable({
    dataSource: sourceDataSource,
    isEditMode,
    onCancel: () => {
      onCancel();
      setIsEditMode(false);
    },
    onSave,
  });

  return (
    <output
      data-datasource={
        dataSource === sessionDataSource ? "session" : "source"
      }
      data-edit-mode={isEditMode}
      data-lifecycle={lifecycle.status}
      data-ready={isEditSessionReady}
    />
  );
};

describe("EditSession React consumers", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("keeps markers through remounts and follows row and column identity", async () => {
    const editSession = createEditSession();
    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);

    await act(async () => {
      root.render(
        <CellMarker
          columnName="price"
          editSession={editSession}
          rowKey="row-1"
        />,
      );
    });
    expect(container.querySelector("output")?.dataset.edited).toBe("true");

    await act(async () => root.render(<div />));
    await act(async () => {
      root.render(
        <CellMarker
          columnName="price"
          editSession={editSession}
          rowKey="row-1"
        />,
      );
    });
    expect(container.querySelector("output")?.dataset.edited).toBe("true");

    await act(async () => {
      root.render(
        <CellMarker
          columnName="price"
          editSession={editSession}
          rowKey="row-2"
        />,
      );
    });
    expect(container.querySelector("output")?.dataset.edited).toBe("false");

    await act(async () => {
      root.render(
        <CellMarker
          columnName="description"
          editSession={editSession}
          rowKey="row-1"
        />,
      );
    });
    expect(container.querySelector("output")?.dataset.edited).toBe("false");
  });

  it("updates a mounted marker when an edit is reverted or undone", async () => {
    const editSession = createEditSession();
    await editSession.begin();
    await act(async () => {
      root.render(
        <CellMarker
          columnName="price"
          editSession={editSession}
          rowKey="row-1"
        />,
      );
    });

    await act(() => editSession.commit("row-1", "price", 100, 101, true));
    expect(container.querySelector("output")?.dataset.edited).toBe("true");

    await act(() => editSession.commit("row-1", "price", 101, 100, true));
    expect(container.querySelector("output")?.dataset.edited).toBe("false");

    await act(() => editSession.commit("row-1", "price", 100, 102, true));
    await act(() => editSession.undoRowChange("row-1"));
    expect(container.querySelector("output")?.dataset.edited).toBe("false");
  });

  it("initializes remounted edit buttons from stale state and force saves", async () => {
    const staleError = new StaleUpdateError("stale");
    const dataSource: DataSource = {
      createSessionDataSource: vi.fn(
        async () => dataSource as unknown as DataSource,
      ),
      editCell: vi.fn().mockResolvedValue(SUCCESS),
      endEditSession: vi.fn().mockRejectedValue(staleError),
    } as unknown as DataSource;
    const editSession = new EditSession({ dataSource: dataSource });
    const onSave = vi.fn();
    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);
    await expect(editSession.end(true)).rejects.toBe(staleError);

    await act(async () =>
      root.render(
        <ToggleableEditButtons editSession={editSession} onSave={onSave} />,
      ),
    );
    expect(container.textContent).toContain("Save (force)");

    await act(async () => {
      (container.querySelector("button") as HTMLButtonElement).click();
    });
    await act(async () => {
      (container.querySelector("button") as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain("Save (force)");

    const buttons = container.querySelectorAll("button");
    await act(async () => buttons[1].click());
    expect(onSave).toHaveBeenCalledWith(true);
  });

  it("exits edit mode and invokes onCancel when the session datasource unsubscribes on disconnect", async () => {
    const endEditSession = vi.fn();
    const sessionDataSource = Object.assign(new EventEmitter(), {
      status: "subscribed",
      tableSchema: {
        columns: [{ name: "price", serverDataType: "double" }],
        key: "id",
        table: { module: "TEST", table: "session-items" },
      },
      endEditSession,
    }) as unknown as DataSource;

    const sourceDataSource = Object.assign(new EventEmitter(), {
      status: "subscribed",
      tableSchema: {
        columns: [{ name: "price", serverDataType: "double" }],
        key: "id",
        table: { module: "TEST", table: "items" },
      },
      createSessionDataSource: vi.fn(async () => sessionDataSource),
    }) as unknown as DataSource;

    const onCancel = vi.fn();
    const onSave = vi.fn();

    await act(async () => {
      root.render(
        <EditableTableHarness
          onCancel={onCancel}
          onSave={onSave}
          sessionDataSource={sessionDataSource}
          sourceDataSource={sourceDataSource}
        />,
      );
    });

    const output = container.querySelector("output");
    expect(output?.dataset.editMode).toBe("true");
    expect(output?.dataset.lifecycle).toBe("active");
    expect(output?.dataset.ready).toBe("true");
    expect(output?.dataset.datasource).toBe("session");

    await act(async () => {
      (sessionDataSource as { status: string }).status = "unsubscribed";
      (sessionDataSource as unknown as EventEmitter).emit(
        "unsubscribed",
        "session-vp",
      );
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    expect(endEditSession).not.toHaveBeenCalled();
    expect(output?.dataset.editMode).toBe("false");
    expect(output?.dataset.lifecycle).toBe("idle");
    expect(output?.dataset.ready).toBe("false");
    expect(output?.dataset.datasource).toBe("source");
  });
});
