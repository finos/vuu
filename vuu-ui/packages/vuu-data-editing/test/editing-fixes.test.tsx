import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DataEditingProvider,
  EditButtons,
  EditField,
  EditModeProvider,
  EditSession,
  useEditSessionState,
  type EditSessionStateSnapshot,
} from "../src";

vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal("Worker", MockWorker);
});

vi.mock("../src/lookup-values/useLookupValues", () => ({
  useLookupValues: () => [],
}));

const SUCCESS = { data: undefined, type: "SUCCESS_RESULT" as const };

const createEditSession = () => {
  const dataSource = {
    createSessionDataSource: vi.fn(async () => dataSource),
    editCell: vi.fn().mockResolvedValue(SUCCESS),
    endEditSession: vi.fn(),
    status: "subscribed",
  } as unknown as DataSource;
  return { dataSource, editSession: new EditSession({ dataSource }) };
};

describe("data editing fixes", () => {
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

  it("useEditSessionState tracks lifecycle and editState", async () => {
    const { editSession } = createEditSession();
    const states: EditSessionStateSnapshot[] = [];
    const Probe = () => {
      states.push(useEditSessionState(editSession));
      return null;
    };
    await act(async () => root.render(<Probe />));
    expect(states.at(-1)).toMatchObject({
      canSave: false,
      isActive: false,
      editState: "clean",
    });

    await act(async () => {
      await editSession.begin();
    });
    expect(states.at(-1)).toMatchObject({
      canCancel: true,
      canSave: false,
      isActive: true,
      inEditMode: true,
    });

    await act(async () => {
      await editSession.commit("key-1", "price", 1, 2, true);
    });
    expect(states.at(-1)).toMatchObject({
      canSave: true,
      editState: "dirty",
      isDirty: true,
    });
  });

  it("useEditSessionState returns a stable snapshot between changes", async () => {
    const { editSession } = createEditSession();
    const states: EditSessionStateSnapshot[] = [];
    const Probe = ({ n }: { n: number }) => {
      states.push(useEditSessionState(editSession));
      return <span>{n}</span>;
    };
    await act(async () => root.render(<Probe n={1} />));
    await act(async () => root.render(<Probe n={2} />));
    expect(states[0]).toBe(states[1]);
  });

  it("EditButtons derives canSave and canCancel from the session", async () => {
    const { editSession } = createEditSession();
    const onSave = vi.fn();
    await act(async () =>
      root.render(
        <EditButtons
          editSession={editSession}
          onCancel={vi.fn()}
          onSave={onSave}
        />,
      ),
    );
    const [save, cancel] = Array.from(container.querySelectorAll("button"));
    expect(save.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);

    await act(async () => {
      await editSession.begin();
    });
    expect(save.disabled).toBe(true);
    expect(cancel.disabled).toBe(false);

    await act(async () => {
      await editSession.commit("key-1", "price", 1, 2, true);
    });
    expect(save.disabled).toBe(false);
  });

  it("EditButtons canSave prop overrides the session value", async () => {
    const { editSession } = createEditSession();
    await act(async () =>
      root.render(
        <EditButtons canSave editSession={editSession} onSave={vi.fn()} />,
      ),
    );
    expect(container.querySelector("button")?.disabled).toBe(false);
  });

  it("EditField checkbox commits a boolean value", async () => {
    const { dataSource, editSession } = createEditSession();
    await editSession.begin();
    const dataRow = { key: "key-1", active: false } as unknown as DataRow;
    await act(async () =>
      root.render(
        <EditModeProvider isEditMode>
          <DataEditingProvider editSession={editSession}>
            <EditField
              dataRow={dataRow}
              label="Active"
              name="active"
              type="checkbox"
            />
          </DataEditingProvider>
        </EditModeProvider>,
      ),
    );
    const checkbox = container.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    );
    expect(checkbox).not.toBeNull();
    await act(async () => {
      checkbox?.click();
    });
    expect(dataSource.editCell).toHaveBeenCalledWith("key-1", "active", true);
    expect(editSession.editState).toBe("dirty");
  });

  it("EditField types numeric values using serverDataType", async () => {
    const { dataSource, editSession } = createEditSession();
    await editSession.begin();
    const dataRow = { key: "key-1", price: 100 } as unknown as DataRow;
    await act(async () =>
      root.render(
        <EditModeProvider isEditMode>
          <DataEditingProvider editSession={editSession}>
            <EditField
              dataRow={dataRow}
              label="Price"
              name="price"
              serverDataType="double"
            />
          </DataEditingProvider>
        </EditModeProvider>,
      ),
    );
    const input = container.querySelector<HTMLInputElement>("input");
    if (!input) throw Error("missing input");
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, "101.5");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await Promise.resolve();
    });
    expect(dataSource.editCell).toHaveBeenCalledWith("key-1", "price", 101.5);
  });
});
