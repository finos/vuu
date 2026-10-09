import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateRowForm, EditField, EditForm, getDataRowValues } from "../src";

vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal("Worker", MockWorker);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

vi.mock("../src/lookup-values/useLookupValues", () => ({
  useLookupValues: () => [],
}));

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

describe("EditForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = async (element: React.ReactElement) => {
    await act(async () => {
      root.render(element);
      await flush();
    });
  };

  const typeAndCommit = async (input: HTMLInputElement, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await flush();
    });
  };

  const clickButton = async (label: string) => {
    const button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === label,
    );
    if (!button) throw Error(`missing button ${label}`);
    await act(async () => {
      button.click();
      await flush();
      await flush();
    });
  };

  const dataRow = { key: "k1", price: 100 } as unknown as DataRow;

  it("shows validate errors on the matching EditField", async () => {
    const dataSource = createDataSource();
    await render(
      <EditForm
        dataRow={dataRow}
        dataSource={dataSource}
        isEditMode
        validate={({ price }) =>
          Number(price) > 1000 ? { price: "Too expensive" } : undefined
        }
      >
        <EditField
          dataRow={dataRow}
          label="Price"
          name="price"
          serverDataType="double"
        />
      </EditForm>,
    );
    const input = container.querySelector<HTMLInputElement>("input");
    if (!input) throw Error("missing input");
    await typeAndCommit(input, "5000");
    await clickButton("Save");
    expect(container.textContent).toContain("Too expensive");
    expect(dataSource.endEditSession).not.toHaveBeenCalled();
  });

  it("shows an error banner when save fails", async () => {
    const dataSource = createDataSource();
    dataSource.endEditSession.mockRejectedValueOnce(
      new Error("Server said no"),
    );
    const onError = vi.fn();
    await render(
      <EditForm
        dataRow={dataRow}
        dataSource={dataSource}
        isEditMode
        onError={onError}
      >
        <EditField
          dataRow={dataRow}
          label="Price"
          name="price"
          serverDataType="double"
        />
      </EditForm>,
    );
    const input = container.querySelector<HTMLInputElement>("input");
    if (!input) throw Error("missing input");
    await typeAndCommit(input, "101");
    await clickButton("Save");
    expect(onError).toHaveBeenCalled();
    expect(container.textContent).toContain("Server said no");
  });

  it("renders fields read-only, without buttons, when not in edit mode", async () => {
    const dataSource = createDataSource();
    await render(
      <EditForm dataRow={dataRow} dataSource={dataSource} isEditMode={false}>
        <EditField dataRow={dataRow} label="Price" name="price" />
      </EditForm>,
    );
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(dataSource.createSessionDataSource).not.toHaveBeenCalled();
  });
});

describe("CreateRowForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("requires values, then adds the row", async () => {
    const dataSource = createDataSource();
    const onSaved = vi.fn();
    await act(async () => {
      root.render(
        <CreateRowForm
          dataSource={dataSource}
          fields={[
            { label: "Name", name: "name" },
            { label: "Notes", name: "notes", required: false },
          ]}
          onSaved={onSaved}
        />,
      );
      await flush();
    });
    expect(dataSource.createSessionDataSource).toHaveBeenCalledWith(
      "Empty",
      "edit",
    );

    const submit = () =>
      act(async () => {
        container
          .querySelector("form")
          ?.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          );
        await flush();
        await flush();
      });

    await submit();
    expect(dataSource.addRow).not.toHaveBeenCalled();

    const [name] = Array.from(container.querySelectorAll("input"));
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(name, "Alice");
      name.dispatchEvent(new Event("input", { bubbles: true }));
      name.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await flush();
    });

    await submit();
    expect(dataSource.addRow).toHaveBeenCalledWith({ name: "Alice" });
    expect(onSaved).toHaveBeenCalled();
  });
});

describe("getDataRowValues", () => {
  it("reads values from rows that serialize via toJSON", () => {
    const proxyRow = new Proxy(
      {},
      {
        get: (_t, prop) =>
          prop === "toJSON"
            ? () => ({ key: "k1", price: 1 })
            : prop === "key"
              ? "k1"
              : undefined,
      },
    ) as DataRow;
    expect({ ...proxyRow }).toEqual({});
    expect(getDataRowValues(proxyRow)).toEqual({ key: "k1", price: 1 });
  });
});
