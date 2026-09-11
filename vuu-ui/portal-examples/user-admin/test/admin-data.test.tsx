import type {
  DataSourceConstructorProps,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAdminTable,
  type AdminTableResource,
} from "../src/data/useAdminTable";

const mocks = vi.hoisted(() => ({
  getTableSchema: vi.fn(),
  showNotification: vi.fn(),
  sources: [] as Array<{
    props: DataSourceConstructorProps;
    callback?: DataSourceSubscribeCallback;
    unsubscribe: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("@vuu-ui/core", () => {
  class Source {
    callback?: DataSourceSubscribeCallback;
    unsubscribe = vi.fn();
    constructor(public props: DataSourceConstructorProps) {
      mocks.sources.push(this);
    }
    subscribe = async (
      _props: DataSourceSubscribeProps,
      callback: DataSourceSubscribeCallback,
    ) => {
      this.callback = callback;
    };
  }
  const getServerAPI = async () => ({ getTableSchema: mocks.getTableSchema });
  return { useData: () => ({ getServerAPI, VuuDataSource: Source }) };
});
vi.mock("@vuu-ui/vuu-notifications", () => ({
  NotificationType: { Toast: "toast" },
  useNotifications: () => ({ showNotification: mocks.showNotification }),
}));

const schema: TableSchema = {
  key: "user_id",
  table: { module: "KEYCLOAK_ADMIN", table: "users" },
  columns: [
    { name: "user_id", serverDataType: "string" },
    { name: "username", serverDataType: "string" },
  ],
};

describe("admin data source lifecycle", () => {
  let root: Root;
  let container: HTMLDivElement;
  let resource: AdminTableResource;
  const Harness = ({ search = "" }: { search?: string }) => {
    resource = useAdminTable("users", { search });
    return <p>{resource.error ?? (resource.loading ? "Loading" : "Ready")}</p>;
  };
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.getTableSchema.mockReset().mockResolvedValue(schema);
    mocks.showNotification.mockClear();
    mocks.sources.length = 0;
    container = document.createElement("div");
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });
  it("subscribes to all server columns with a committed server filter", async () => {
    await act(async () => root.render(<Harness search="alice" />));
    expect(mocks.sources[0].props).toMatchObject({
      columns: ["user_id", "username"],
      table: schema.table,
      filterSpec: { filter: 'username contains "alice"' },
    });
    expect(container.textContent).toBe("Ready");
    await act(async () => root.render(<Harness search="bob" />));
    expect(mocks.sources[0].unsubscribe).toHaveBeenCalled();
    expect(mocks.sources[1].props.filterSpec?.filter).toBe(
      'username contains "bob"',
    );
  });
  it("ignores a schema request completed after its consumer unmounts", async () => {
    let resolve: (schema: TableSchema) => void = () => {
      throw new Error("No pending schema");
    };
    mocks.getTableSchema.mockReturnValue(
      new Promise<TableSchema>((done) => {
        resolve = done;
      }),
    );
    await act(async () => root.render(<Harness />));
    await act(async () => root.render(null));
    await act(async () => resolve(schema));
    expect(mocks.sources).toHaveLength(0);
  });
  it("reports schema errors instead of rendering a successful empty table", async () => {
    mocks.getTableSchema.mockRejectedValue(
      new Error("Missing KEYCLOAK_ADMIN users"),
    );
    await act(async () => root.render(<Harness />));
    expect(container.textContent).toContain("Missing KEYCLOAK_ADMIN users");
    expect(mocks.showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });
  it("reports viewport subscription failure through the same resource and Toast", async () => {
    await act(async () => root.render(<Harness />));
    await act(async () => {
      await resource.dataSource?.subscribe({}, () => undefined);
      mocks.sources[0].callback?.({
        type: "subscribe-failed",
        msg: "Permission denied",
        clientViewportId: "test",
      });
    });
    expect(container.textContent).toContain("Permission denied");
    expect(mocks.showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Permission denied" }),
    );
  });
});
