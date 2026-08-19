import type {
  DataSource,
  DataSourceSubscribeCallback,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminEditForm,
  type AdminEditFormProps,
} from "../src/components/AdminEditForm";
import type {
  AdminQuery,
  AdminRecord,
  AdminTableName,
} from "../src/data/admin-contract";

const mocks = vi.hoisted(() => {
  vi.stubGlobal(
    "Worker",
    class {
      postMessage() {}
      terminate() {}
    },
  );
  return {
    notify: vi.fn(),
    queries: vi.fn(),
    clientIdentifier: "vuu-portal",
    remoteModules: [
      {
        name: "user-admin",
        title: "User Admin",
        clientIdentifier: "vuu-user-admin",
        loginRole: "user-admin-access",
      },
    ],
  };
});
vi.mock("@vuu-ui/vuu-notifications", () => ({
  useNotifications: () => ({ showNotification: mocks.notify }),
}));
vi.mock("@vuu-ui/core/portal", () => ({
  usePortalModuleRegistry: () => ({
    remoteModules: mocks.remoteModules,
  }),
}));
vi.mock("../src/components/AdminTable", () => ({
  AdminTable: ({
    name,
    onSelect,
    query,
  }: {
    name: AdminTableName;
    onSelect: (record: AdminRecord) => void;
    query?: AdminQuery;
  }) => {
    mocks.queries(query);
    if (name === "groups")
      return (
        <button
          type="button"
          onClick={() => onSelect({ group_id: "g1", group_name: "Traders" })}
        >
          Choose Traders
        </button>
      );
    if (name === "user_groups")
      return (
        <button
          type="button"
          onClick={() => onSelect({ group_id: "g1", group_name: "Traders" })}
        >
          Remove Traders
        </button>
      );
    if (name === "roles")
      return (
        <button
          type="button"
          onClick={() =>
            onSelect({
              role_id: "r1",
              role_name: "Trading",
              client_id: "c1",
              client_identifier: mocks.clientIdentifier,
            })
          }
        >
          Choose Trading
        </button>
      );
    if (name === "group_roles")
      return (
        <button
          type="button"
          onClick={() =>
            onSelect({
              role_id: "r1",
              role_name: "Trading",
              client_id: "c1",
              client_identifier: mocks.clientIdentifier,
            })
          }
        >
          Remove Trading
        </button>
      );
    return (
      <button
        type="button"
        onClick={() =>
          onSelect({
            key: "client-1",
            client_id: "client-1",
            client_name: "Portal",
            client_identifier: mocks.clientIdentifier,
          })
        }
      >
        Choose Portal
      </button>
    );
  },
}));

const SUCCESS = { type: "SUCCESS_RESULT", data: undefined };
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const schemaFor = (
  columns = [
    "username",
    "email",
    "first_name",
    "last_name",
    "enabled",
    "password_update_required",
  ],
): TableSchema => ({
  table: { module: "KEYCLOAK_ADMIN", table: "users" },
  key: "user_id",
  columns: columns.map((name) => ({ name, serverDataType: "string" })),
});

describe("AdminEditForm sessions", () => {
  let root: Root;
  let container: HTMLDivElement;
  let props: AdminEditFormProps;
  let end: ReturnType<typeof vi.fn>;
  let add: ReturnType<typeof vi.fn>;
  let edit: ReturnType<typeof vi.fn>;
  let persist: ReturnType<typeof vi.fn>;
  let begin: ReturnType<typeof vi.fn>;
  let session: DataSource;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.notify.mockClear();
    mocks.queries.mockClear();
    mocks.clientIdentifier = "vuu-portal";
    mocks.remoteModules.splice(0, mocks.remoteModules.length, {
      name: "user-admin",
      title: "User Admin",
      clientIdentifier: "vuu-user-admin",
      loginRole: "user-admin-access",
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    end = vi.fn().mockResolvedValue(undefined);
    add = vi.fn().mockResolvedValue(SUCCESS);
    edit = vi.fn().mockResolvedValue(SUCCESS);
    persist = vi.fn().mockResolvedValue(SUCCESS);
    const rpcRequest = vi.fn((request) => {
      if (request.rpcName === "getUserModuleAccessOptions") {
        return Promise.resolve({
          type: "SUCCESS_RESULT",
          data: {
            modules: mocks.remoteModules.map((module, index) => {
              const groupId =
                index === 0 ? "g-default" : `${module.name}-default`;
              return {
                clientIdentifier: module.clientIdentifier,
                loginRole: module.loginRole,
                selectedGroupId: index === 0 ? groupId : undefined,
                groups: [
                  {
                    groupId,
                    groupName: `${module.title} viewers`,
                    groupPath: `/${module.name}/viewers`,
                    roleId: `${module.name}-viewer-role`,
                    roleName: `${module.loginRole}-access`,
                    privilege: "default",
                    isDefault: true,
                  },
                  {
                    groupId: `${module.name}-elevated`,
                    groupName: `${module.title} operators`,
                    groupPath: `/${module.name}/operators`,
                    roleId: `${module.name}-operator-role`,
                    roleName: `${module.loginRole}-access`,
                    privilege: "elevated",
                    isDefault: false,
                  },
                ],
              };
            }),
          },
        });
      }
      return persist(request);
    });
    session = {
      endEditSession: end,
      addRow: add,
      editCell: edit,
      unsubscribe: vi.fn(),
      subscribe: vi.fn(
        async (_options, callback: DataSourceSubscribeCallback) => {
          callback({
            type: "subscribed",
            tableSchema: props.schema,
          } as Parameters<DataSourceSubscribeCallback>[0]);
        },
      ),
    } as unknown as DataSource;
    begin = vi.fn().mockResolvedValue(session);
    props = {
      entity: "users",
      schema: schemaFor(),
      dataSource: {
        createSessionDataSource: begin,
        selectedRowsCount: 1,
        rpcRequest,
      } as unknown as DataSource,
      onClose: vi.fn(),
    };
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });
  const render = async (strict = false) => {
    await act(async () =>
      root.render(
        strict ? (
          <StrictMode>
            <AdminEditForm {...props} />
          </StrictMode>
        ) : (
          <AdminEditForm {...props} />
        ),
      ),
    );
  };
  const control = (label: string) => {
    const element = [...container.querySelectorAll("label")].find((node) =>
      node.textContent?.startsWith(label),
    );
    if (!element?.htmlFor) throw new Error(`No labelled control: ${label}`);
    const input = document.getElementById(element.htmlFor);
    if (!(input instanceof HTMLInputElement))
      throw new Error(`No input: ${label}`);
    return input;
  };
  const change = async (label: string, value: string) => {
    const input = control(label);
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };
  const click = async (text: string) => {
    const button = [...container.querySelectorAll("button")].find(
      (node) => node.textContent === text,
    );
    if (!button) throw new Error(`Missing ${text}`);
    await act(async () => button.click());
  };
  const submit = async () => {
    await act(async () =>
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
  };

  it("opens one empty session under StrictMode and ends it on unmount", async () => {
    await render(true);
    expect(begin).toHaveBeenCalledTimes(1);
    expect(begin).toHaveBeenCalledWith("Empty", "edit");
    expect(session.subscribe).toHaveBeenCalledOnce();
    await act(async () => root.unmount());
    expect(end).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledWith(false, false);
  });

  it("keeps the same session across drafts, persists through addUser, then discards the session", async () => {
    await render();
    await change("Username", "alice");
    await change("Email", "alice@example.com");
    await submit();
    expect(begin).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "addUser",
        params: expect.objectContaining({
          username: "alice",
          email: "alice@example.com",
          enabled: true,
        }),
      }),
    );
    expect(add).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledWith(false, false);
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
    );
  });

  it("does not repeat persistent creation after session cleanup failure", async () => {
    end
      .mockResolvedValueOnce({
        type: "ERROR_RESULT",
        errorMessage: "Save rejected",
      })
      .mockResolvedValue(undefined);
    await render();
    await change("Username", "alice");
    await submit();
    expect(container.textContent).toContain("Save rejected");
    expect(props.onClose).not.toHaveBeenCalled();
    expect(control("Username").disabled).toBe(true);
    await submit();
    expect(persist).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledTimes(2);
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: "toast", status: "error" }),
    );
  });

  it("keeps a rejected domain mutation editable and retries without ending prematurely", async () => {
    persist
      .mockResolvedValueOnce({
        type: "ERROR_RESULT",
        errorMessage: "Duplicate username",
      })
      .mockResolvedValue(SUCCESS);
    await render();
    await change("Username", "alice");
    await submit();
    expect(end).not.toHaveBeenCalled();
    expect(control("Username").disabled).toBe(false);
    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
    );
    await change("Username", "different");
    await submit();
    expect(persist).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ username: "different" }),
      }),
    );
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("uses Selected for edits and retries rejected updateUser RPCs", async () => {
    props.record = {
      key: "u1",
      user_id: "u1",
      username: "alice",
      enabled: true,
      password_update_required: false,
    };
    persist
      .mockResolvedValueOnce({
        type: "ERROR_RESULT",
        errorMessage: "Update rejected",
      })
      .mockResolvedValue(SUCCESS);
    await render();
    await change("Username", "updated");
    await submit();
    expect(begin).toHaveBeenCalledWith("Selected", "edit");
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "updateUser",
        params: expect.objectContaining({ userId: "u1", username: "updated" }),
      }),
    );
    expect(end).not.toHaveBeenCalled();
    await submit();
    expect(add).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("refuses to copy an unselected or multi-selected entity source", async () => {
    props.record = { key: "u1", username: "alice" };
    props.dataSource = {
      createSessionDataSource: begin,
      selectedRowsCount: 2,
    } as unknown as DataSource;
    await render();
    expect(begin).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Select exactly one entity");
  });

  it("serializes unmount behind pending begin and reports cleanup failure", async () => {
    const pending = deferred<DataSource>();
    begin.mockReturnValue(pending.promise);
    await render();
    await act(async () => root.unmount());
    expect(end).not.toHaveBeenCalled();
    end.mockRejectedValue(new Error("Discard failed"));
    await act(async () => pending.resolve(session));
    expect(end).toHaveBeenCalledWith(false, false);
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Discard failed" }),
    );
  });

  it("serializes unmount after a pending domain mutation, then discards the generic session", async () => {
    const pending = deferred<typeof SUCCESS>();
    persist.mockReturnValue(pending.promise);
    await render();
    await change("Username", "alice");
    await submit();
    await act(async () => root.unmount());
    expect(end).not.toHaveBeenCalled();
    await act(async () => pending.resolve(SUCCESS));
    expect(end).toHaveBeenCalledWith(false, false);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("shows begin failures and allows closing without a leaked session", async () => {
    begin.mockRejectedValue(new Error("No session backend"));
    await render();
    expect(container.textContent).toContain("No session backend");
    await click("Cancel");
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(end).not.toHaveBeenCalled();
  });

  it("waits for subscription acknowledgement before enabling saves", async () => {
    let callback!: DataSourceSubscribeCallback;
    session.subscribe = vi.fn(async (_options, listener) => {
      callback = listener;
    });
    await render();
    expect(control("Username").disabled).toBe(true);
    await act(async () =>
      callback({
        type: "subscribed",
        tableSchema: props.schema,
      } as Parameters<DataSourceSubscribeCallback>[0]),
    );
    expect(control("Username").disabled).toBe(false);
  });

  it("reports subscription errors and still ends the created session", async () => {
    session.subscribe = vi.fn(async (_options, callback) => {
      callback({
        type: "subscribe-failed",
        msg: "Session unavailable",
      } as Parameters<DataSourceSubscribeCallback>[0]);
    });
    await render();
    expect(container.textContent).toContain("Session unavailable");
    await click("Cancel");
    expect(end).toHaveBeenCalledWith(false, false);
    expect(session.unsubscribe).toHaveBeenCalledOnce();
  });

  it("defers create module access display without guessing an ID", async () => {
    await render();
    expect(control("Temporary password").disabled).toBe(false);
    expect(container.textContent).toContain("Save this user, then reopen it");
    expect(container.textContent).not.toContain("Group membership");
    await click("Cancel");
    expect(persist).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledWith(false, false);
  });

  it.each([
    false,
    true,
  ])("omits the read-only password policy from the editor (existing user: %s)", async (existing) => {
    if (existing) {
      props.record = {
        key: "u1",
        user_id: "u1",
        username: "alice",
        password_update_required: true,
      };
    }
    expect(
      props.schema.columns.some(
        ({ name }) => name === "password_update_required",
      ),
    ).toBe(true);
    await render();
    expect(container.textContent).not.toContain("Password update required");
    expect(
      container.querySelector('input[aria-label="Password update required"]'),
    ).toBeNull();
    expect(control("Temporary password").disabled).toBe(false);
    expect(control("Temporary password").type).toBe("password");
    expect(control("Temporary password").value).toBe("");
    if (!existing) await change("Username", "alice");
    await submit();
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: existing ? "updateUser" : "addUser",
        params: expect.not.objectContaining({
          password_update_required: expect.anything(),
        }),
      }),
    );
  });

  it("sends a write-only temporary password without requiring or exposing a schema column", async () => {
    await render();
    expect(
      props.schema.columns.some(({ name }) => name === "temporary_password"),
    ).toBe(false);
    await change("Username", "alice");
    await change("Temporary password", "one-time-secret");
    await submit();
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "addUser",
        params: expect.objectContaining({
          temporary_password: "one-time-secret",
        }),
      }),
    );
    expect(
      mocks.notify.mock.calls
        .flat()
        .some((notification) =>
          JSON.stringify(notification).includes("one-time-secret"),
        ),
    ).toBe(false);
  });

  it("shows module access without exposing group or role assignments for users", async () => {
    props.record = {
      key: "u1",
      user_id: "u1",
      username: "alice",
      enabled: true,
      module_access: "user-admin-access",
    };
    await render();
    expect(container.textContent).toContain("Portal module access");
    expect(container.textContent).toContain("User Admin");
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    expect(container.querySelector('[role="option"]')?.textContent).toBe(
      "User Admin",
    );
    expect(container.textContent).not.toContain("Group membership");
    expect(container.textContent).not.toContain("Client-role assignments");
    expect(container.textContent).not.toContain("Choose Traders");
    expect(container.textContent).not.toContain("Remove Traders");
    expect(mocks.queries).not.toHaveBeenCalled();
  });

  it("stages module additions with default groups and saves selected alternatives", async () => {
    mocks.remoteModules.push({
      name: "trading",
      title: "Trading",
      clientIdentifier: "vuu-trading",
      loginRole: "trading-login",
    });
    props.record = {
      key: "u1",
      user_id: "u1",
      username: "alice",
      enabled: true,
      module_access: "user-admin-access",
    };
    await render();
    expect(container.textContent).not.toContain(
      "Associate groups with modules",
    );
    const addTrading = container.querySelector<HTMLButtonElement>(
      '.vuuItemPicker-availableList [data-name="trading-login"] button',
    );
    expect(addTrading).not.toBeNull();
    await act(async () => addTrading?.click());
    expect(container.textContent).toContain("Trading group");
    const tradingGroups = container.querySelector<HTMLElement>(
      '[aria-label="trading-login group"]',
    );
    expect(tradingGroups).not.toBeNull();
    const elevated = [
      ...(tradingGroups?.querySelectorAll('[role="option"]') ?? []),
    ].find((option) => option.textContent?.includes("elevated"));
    expect(elevated).not.toBeNull();
    await act(async () =>
      elevated?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    await submit();
    expect(persist).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: "setUserModuleAccess",
      params: {
        userId: "u1",
        assignments: JSON.stringify([
          { loginRole: "trading-login", groupId: "trading-elevated" },
          { loginRole: "user-admin-access", groupId: "g-default" },
        ]),
      },
    });
  });

  it("persists group client-role assignments with stable role and client IDs", async () => {
    props.entity = "groups";
    props.schema = schemaFor(["group_name"]);
    props.record = { key: "g1", group_id: "g1", group_name: "Traders" };
    await render();
    await click("Choose Trading");
    await submit();
    expect(persist).toHaveBeenLastCalledWith({
      type: "RPC_REQUEST",
      rpcName: "assignGroupRole",
      params: { groupId: "g1", roleId: "r1", clientId: "c1" },
    });
  });

  it("does not save when required schema fields are absent", async () => {
    props.schema = schemaFor(["email"]);
    await render();
    expect(
      [...container.querySelectorAll("button")].find(
        (button) => button.textContent === "Save",
      )?.disabled,
    ).toBe(true);
    await submit();
    expect(add).not.toHaveBeenCalled();
  });

  it("rejects out-of-scope client rows before a role target can be selected", async () => {
    props.entity = "roles";
    props.schema = schemaFor(["role_name", "client_id", "description"]);
    mocks.clientIdentifier = "account";
    await render();
    await change("Role name", "admin");
    await click("Choose Portal");
    expect(container.textContent).toContain("Only Vuu portal clients");
    expect(container.textContent).not.toContain("Selected: Portal");
    await submit();
    expect(persist).not.toHaveBeenCalled();
    mocks.clientIdentifier = "vuu-portal";
    await click("Choose Portal");
    await submit();
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({ rpcName: "addClientRole" }),
    );
  });

  it("rejects an out-of-scope role edit even if supplied directly instead of from a filtered table", async () => {
    props.entity = "roles";
    props.schema = schemaFor([
      "role_name",
      "client_id",
      "client_identifier",
      "description",
    ]);
    props.record = {
      key: "r1",
      role_id: "r1",
      role_name: "Admin",
      client_id: "c1",
      client_identifier: "realm-management",
    };
    await render();
    await change("Role name", "updated");
    await submit();
    expect(persist).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Only Vuu portal clients");
  });

  it.each([
    "Choose Trading",
    "Remove Trading",
  ])("does not stage non-Vuu group roles through %s", async (button) => {
    props.entity = "groups";
    props.schema = schemaFor(["group_name"]);
    props.record = { key: "g1", group_id: "g1", group_name: "Traders" };
    mocks.clientIdentifier = "account";
    await render();
    await click(button);
    expect(container.textContent).toContain("Only Vuu portal clients");
    expect(
      container.querySelector('[aria-label="Pending relationship changes"]'),
    ).toBeNull();
    await submit();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({ rpcName: "updateGroup" }),
    );
  });

  it("persists group names but disables unsupported hierarchy writes even when schema columns exist", async () => {
    props.entity = "groups";
    props.schema = schemaFor(["group_name", "group_path", "parent_group_id"]);
    await render();
    expect(control("Group path").disabled).toBe(true);
    await change("Group name", "Traders");
    await submit();
    expect(persist).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: "addGroup",
      params: { name: "Traders" },
    });
    expect(end).toHaveBeenCalledWith(false, false);
  });

  it("requires a Vuu client selection, supports Enter search and exposes selected client", async () => {
    props.entity = "roles";
    props.schema = schemaFor(["role_name", "client_id", "description"]);
    await render();
    expect(container.querySelector('input[name="client_id"]')).toBeNull();
    await change("Role name", "admin");
    await submit();
    expect(add).not.toHaveBeenCalled();
    const search = container.querySelector<HTMLInputElement>(
      'input[placeholder="Type a search and press Enter"]',
    );
    if (!search) throw new Error("Missing client search");
    await act(async () => {
      search.value = "portal";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(mocks.queries).not.toHaveBeenCalledWith({ search: "portal" });
    await act(async () =>
      search.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(mocks.queries).toHaveBeenLastCalledWith({ search: "portal" });
    await click("Choose Portal");
    expect(container.textContent).toContain("Selected: Portal (client-1)");
    await submit();
    expect(persist).toHaveBeenCalledWith({
      type: "RPC_REQUEST",
      rpcName: "addClientRole",
      params: { name: "admin", clientId: "client-1", description: "" },
    });
  });
});
