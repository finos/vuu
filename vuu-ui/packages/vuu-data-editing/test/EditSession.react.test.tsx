import type { DataSource, EditApi } from "@vuu-ui/vuu-data-types";
import { act, useState } from "react";
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
} from "../src";

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
  const dataSource: EditApi = {
    createSessionDataSource: vi.fn(
      async () => dataSource as unknown as DataSource,
    ),
    editCell: vi.fn().mockResolvedValue(SUCCESS),
    endEditSession: vi.fn(),
    undoRowChange: vi.fn().mockResolvedValue(SUCCESS),
  };
  return new EditSession(dataSource);
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
    const dataSource: EditApi = {
      createSessionDataSource: vi.fn(
        async () => dataSource as unknown as DataSource,
      ),
      editCell: vi.fn().mockResolvedValue(SUCCESS),
      endEditSession: vi.fn().mockRejectedValue(staleError),
    };
    const editSession = new EditSession(dataSource);
    const onSave = vi.fn();
    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);
    await expect(editSession.end(true)).rejects.toBe(staleError);

    const Fixture = () => {
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
    await act(async () => root.render(<Fixture />));
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
});
