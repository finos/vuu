import { DirectEditSession, useTableEditSession } from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditableTable } from "../../src/editable-table/EditableTable";
import { EditableTableTable } from "../../src/editable-table/EditableTableLayout";
import { TableEditorModeToggle } from "../../src/table-editor";

const rendered = vi.hoisted(() => ({
  editSession: undefined as unknown,
  props: undefined as TableProps | undefined,
}));

vi.mock("@vuu-ui/vuu-table", () => ({
  Table: (props: TableProps) => {
    rendered.props = props;
    rendered.editSession = useTableEditSession();
    return null;
  },
}));

vi.mock("../../src/datasource-stats/DatasourceStats", () => ({
  DataSourceStats: () => <span data-testid="stats" />,
}));

const config: TableConfig = {
  columns: [
    { name: "ric", serverDataType: "string" },
    { name: "description", serverDataType: "string" },
    { name: "lotSize", serverDataType: "int" },
  ],
};

const dataSource = { editCell: vi.fn() } as unknown as DataSource;

const editableColumns = () =>
  rendered.props?.config.columns
    .filter((column) => column.editable)
    .map((column) => column.name);

describe("EditableTable, direct editing", () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (element: ReactElement) =>
    act(async () => {
      root.render(element);
    });

  const click = (testId: string) =>
    act(async () => {
      container
        .querySelector<HTMLButtonElement>(`[data-testid='${testId}']`)
        ?.click();
    });

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    rendered.editSession = undefined;
    rendered.props = undefined;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("is always editable, against the source dataSource, by default", async () => {
    await render(
      <EditableTable
        config={config}
        dataSource={dataSource}
        editModel="direct"
        editable={{ description: true, lotSize: true }}
      />,
    );
    expect(rendered.props?.dataSource).toBe(dataSource);
    expect(rendered.editSession).toBeInstanceOf(DirectEditSession);
    expect((rendered.editSession as DirectEditSession).dataSource).toBe(
      dataSource,
    );
    expect(editableColumns()).toEqual(["description", "lotSize"]);
    expect(container.querySelector("[data-testid='toggle-edit']")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("[data-testid='stats']")).not.toBeNull();
  });

  it("supports View/Edit modes, with no Save or Cancel", async () => {
    await render(
      <EditableTable
        config={config}
        dataSource={dataSource}
        defaultMode="view"
        editModel="direct"
        editable={{ description: true }}
        showEditModeToggle
      />,
    );
    expect(editableColumns()).toEqual([]);

    await click("toggle-edit");
    expect(editableColumns()).toEqual(["description"]);
    expect(container.textContent).not.toMatch(/Save|Cancel/);

    await click("toggle-view");
    expect(editableColumns()).toEqual([]);
  });

  it("composes EditableTableTable, with a controlled mode", async () => {
    const onModeChange = vi.fn();
    await render(
      <EditableTable
        dataSource={dataSource}
        editModel="direct"
        mode="view"
        onModeChange={onModeChange}
      >
        <TableEditorModeToggle />
        <EditableTableTable config={config} readOnly={["ric"]} />
      </EditableTable>,
    );
    expect(editableColumns()).toEqual([]);
    expect(container.querySelector(".vuuEditableTable-table")).not.toBeNull();

    await click("toggle-edit");
    expect(onModeChange).toHaveBeenCalledWith("edit");
    // controlled: stays in view mode until the parent changes `mode`
    expect(editableColumns()).toEqual([]);

    await render(
      <EditableTable dataSource={dataSource} editModel="direct" mode="edit">
        <EditableTableTable config={config} readOnly={["ric"]} />
      </EditableTable>,
    );
    expect(editableColumns()).toEqual(["description", "lotSize"]);
  });
});
