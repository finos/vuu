import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { DataEditingProvider } from "../src/DataEditingProvider";
import { EditSession } from "../src/EditSession";
import { EditModeProvider } from "../src/EditModeProvider";
import { EditField } from "../src/edit-field/EditField";

vi.mock("../src/lookup-values/useLookupValues", () => ({
  useLookupValues: () => [],
}));

const SUCCESS = { data: undefined, type: "SUCCESS_RESULT" as const };
const dataRow = {
  key: EditSession.newRowKey,
} as unknown as DataRow;

describe("EditField new-row behavior", () => {
  let container: HTMLDivElement;
  let root: Root;
  let editSession: EditSession;
  let addRow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    addRow = vi.fn().mockResolvedValue(SUCCESS);
    editSession = new EditSession({
      dataSource: { addRow } as unknown as DataSource,
    });
    editSession.configureNewRow(["role_name"], ["role_name"]);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const renderField = async (deferNewRow = false) => {
    await act(async () => {
      root.render(
        <EditModeProvider isEditMode>
          <DataEditingProvider editSession={editSession}>
            <EditField
              dataRow={dataRow}
              deferNewRow={deferNewRow}
              label="Role name"
              name="role_name"
            />
          </DataEditingProvider>
        </EditModeProvider>,
      );
    });
  };

  const typeAndCommit = async (value: string) => {
    const input = container.querySelector<HTMLInputElement>("input");
    if (!input) throw new Error("Missing role name input");
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await Promise.resolve();
    });
  };

  it("can stage a form draft without triggering automatic row insertion", async () => {
    await renderField(true);
    await typeAndCommit("Administrator");

    expect(editSession.newRowState.values.role_name).toBe("Administrator");
    expect(addRow).not.toHaveBeenCalled();
  });

  it("keeps automatic insertion as the default for InlineAddRow fields", async () => {
    await renderField();
    await typeAndCommit("Administrator");

    expect(addRow).toHaveBeenCalledWith({ role_name: "Administrator" });
  });
});
