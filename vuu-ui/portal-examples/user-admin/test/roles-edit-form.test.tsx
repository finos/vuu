import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditModeProvider, EditSession } from "@vuu-ui/vuu-data-editing";
import { PortalModuleRegistryProvider } from "@vuu-ui/core/portal";
import { RolesEditForm } from "../src/components/roles-edit-form/RolesEditForm";
import {
  buildApplicationModel,
  deriveApplications,
} from "../src/data/applications";
import { ApplicationModelContext } from "../src/data/useApplicationModel";

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
}));

vi.mock("@vuu-ui/vuu-notifications", () => ({
  useNotifications: () => ({ showNotification: mocks.notify }),
}));

vi.mock("@salt-ds/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salt-ds/core")>();
  const React = await import("react");
  return {
    ...actual,
    Dropdown: ({
      "aria-label": ariaLabel,
      children,
      onSelectionChange,
      value,
    }: {
      "aria-label"?: string;
      children: React.ReactNode;
      onSelectionChange: (
        event: React.SyntheticEvent,
        options: unknown[],
      ) => void;
      value: string;
    }) => {
      const options = React.Children.toArray(children).flatMap((child) =>
        React.isValidElement<{
          children: React.ReactNode;
          disabled?: boolean;
          value: unknown;
        }>(child)
          ? [child.props]
          : [],
      );
      return React.createElement(
        "select",
        {
          "aria-label": ariaLabel,
          value,
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selected = options.find(
              (option) => option.children === event.currentTarget.value,
            );
            if (selected && !selected.disabled)
              onSelectionChange(event, [selected.value]);
          },
        },
        React.createElement("option", { key: "", value: "" }),
        ...options.map((option) =>
          React.createElement(
            "option",
            {
              disabled: option.disabled,
              key: String(option.children),
              value: String(option.children),
            },
            option.children,
          ),
        ),
      );
    },
  };
});

const { applications } = deriveApplications([
  {
    accessRole: "basket-trading-access",
    clientIdentifier: "vuu-basket-trading",
    name: "basket-trading",
    title: "Basket Trading",
  },
  {
    accessRole: "user-admin-access",
    clientIdentifier: "vuu-user-admin",
    name: "user-admin",
    title: "User Admin",
  },
  {
    accessRole: "reports-access",
    clientIdentifier: "vuu-reports",
    name: "reports",
    title: "Reports",
  },
]);
const model = buildApplicationModel({
  applications,
  clients: [
    {
      client_id: "client-1",
      client_identifier: "vuu-portal",
      client_name: "Vuu Portal",
    },
    {
      client_id: "client-2",
      client_identifier: "vuu-basket-trading",
      client_name: "Basket Trading",
    },
    {
      client_id: "client-3",
      client_identifier: "vuu-user-admin",
      client_name: "User Admin",
    },
  ],
  groupRoles: [],
  groups: [],
  roles: [
    {
      client_identifier: "vuu-portal",
      role_id: "role-access",
      role_name: "basket-trading-access",
    },
  ],
});

const remoteModules = applications.map((application, id) => ({
  accessRole: application.accessRole,
  clientIdentifier: application.clientIdentifier,
  description: "",
  id,
  mfComponent: "Module",
  mfScope: application.name,
  mfUrl: "http://localhost",
  name: application.name,
  navLocation: `/Apps/${application.title}`,
  path: `/${application.name}`,
  title: application.title,
  version: 1,
}));

const SUCCESS = { type: "SUCCESS_RESULT", data: undefined };
const newRoleRow = {
  key: EditSession.newRowKey,
} as unknown as DataRow;

describe("RolesEditForm create flow", () => {
  let container: HTMLDivElement;
  let root: Root;
  let rpcRequest: ReturnType<typeof vi.fn>;
  let datasourceAddRow: ReturnType<typeof vi.fn>;
  let endEditSession: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  let dataSource: DataSource;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.notify.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    rpcRequest = vi.fn().mockResolvedValue(SUCCESS);
    datasourceAddRow = vi.fn().mockResolvedValue(SUCCESS);
    endEditSession = vi.fn().mockResolvedValue(SUCCESS);
    close = vi.fn();
    dataSource = {
      addRow: datasourceAddRow,
      createSessionDataSource: vi.fn().mockResolvedValue({
        addRow: datasourceAddRow,
        endEditSession,
      }),
      rpcRequest,
    } as unknown as DataSource;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const render = async (application?: string) => {
    await act(async () => {
      root.render(
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <ApplicationModelContext.Provider value={{ loading: false, model }}>
            <EditModeProvider isEditMode>
              <RolesEditForm
                application={application}
                dataRow={newRoleRow}
                dataSource={dataSource}
                onClose={close}
              />
            </EditModeProvider>
          </ApplicationModelContext.Provider>
        </PortalModuleRegistryProvider>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  const chooseApplication = async (label: string) => {
    const select = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Application"]',
    );
    if (!select) throw new Error("Missing application dropdown");
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value",
      )?.set?.call(select, label);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  };

  const changeField = async (name: string, value: string) => {
    const input = container.querySelector<HTMLInputElement>(
      `[data-field="${name}"] input`,
    );
    if (!input) throw new Error(`Missing ${name} input`);
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  const click = async (label: string) => {
    const button = [...container.querySelectorAll("button")].find(
      (candidate) => candidate.textContent === label,
    );
    if (!button) throw new Error(`Missing ${label} button`);
    await act(async () => button.click());
  };

  const submit = async () => {
    await act(async () => {
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it("keeps the draft in EditSession until Save and stages all role values once", async () => {
    await render();
    await chooseApplication("Basket Trading");
    await changeField("role_name", "Administrator");
    await changeField("description", "Administrative access");

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();
    expect(endEditSession).not.toHaveBeenCalled();

    await submit();

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).toHaveBeenCalledTimes(1);
    expect(datasourceAddRow).toHaveBeenCalledWith({
      client_id: "client-2",
      client_identifier: "vuu-basket-trading",
      client_name: "Basket Trading",
      description: "Administrative access",
      role_name: "Administrator",
    });
    expect(endEditSession).toHaveBeenCalledWith(true, false);
    expect(close).toHaveBeenCalledOnce();
  });

  it("includes an empty optional description in the staged role row", async () => {
    await render();
    await chooseApplication("Basket Trading");
    await changeField("role_name", "Administrator");
    await submit();

    expect(datasourceAddRow).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "",
        role_name: "Administrator",
      }),
    );
    expect(endEditSession).toHaveBeenCalledWith(true, false);
  });

  it("does not create a role when the draft is cancelled", async () => {
    await render();
    await chooseApplication("Basket Trading");
    await changeField("role_name", "Administrator");
    await click("Cancel");

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();
    expect(endEditSession).toHaveBeenCalledWith(false, false);
    expect(close).toHaveBeenCalledOnce();
  });

  it("requires both a role name and an application before insertion", async () => {
    await render();
    await submit();

    expect(container.textContent).toContain("Role name is required.");
    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();

    await changeField("role_name", "Administrator");
    expect(container.textContent).not.toContain("Role name is required.");
    await submit();

    expect(container.textContent).toContain("Application is required.");
    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();
  });

  it("offers applications, not clients, and disables applications without a client", async () => {
    await render();
    const select = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Application"]',
    );
    expect(container.querySelector('select[aria-label="Client"]')).toBeNull();
    expect(
      [...(select?.options ?? [])]
        .filter(({ value }) => value)
        .map(({ disabled, textContent }) => [textContent, disabled]),
    ).toEqual([
      ["Basket Trading", false],
      ["Reports", true],
      ["User Admin", false],
    ]);

    await chooseApplication("User Admin");
    await changeField("role_name", "auditor");
    await submit();

    expect(datasourceAddRow).toHaveBeenCalledWith({
      client_id: "client-3",
      client_identifier: "vuu-user-admin",
      client_name: "User Admin",
      description: "",
      role_name: "auditor",
    });
  });

  it("preselects the application passed from the page", async () => {
    await render("basket-trading");
    await changeField("role_name", "trader");
    await submit();

    expect(datasourceAddRow).toHaveBeenCalledWith(
      expect.objectContaining({
        client_identifier: "vuu-basket-trading",
        role_name: "trader",
      }),
    );
  });

  it("shows portal access roles as read-only", async () => {
    await act(async () => {
      root.render(
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <EditModeProvider isEditMode>
            <RolesEditForm
              dataRow={
                {
                  client_identifier: "vuu-portal",
                  description: "",
                  key: "role-access",
                  role_id: "role-access",
                  role_name: "basket-trading-access",
                } as unknown as DataRow
              }
              dataSource={dataSource}
            />
          </EditModeProvider>
        </PortalModuleRegistryProvider>,
      );
    });

    expect(container.textContent).toContain("Portal access role");
    expect(container.textContent).toContain(
      "controls who can open Basket Trading",
    );
    expect(container.textContent).not.toContain("Edit");
    expect(
      [...container.querySelectorAll("input")].every(
        (input) => input.readOnly || input.disabled,
      ),
    ).toBe(true);
  });

  it("keeps the staged row after a session-save failure and retries without adding twice", async () => {
    endEditSession
      .mockRejectedValueOnce(new Error("temporary service failure"))
      .mockResolvedValueOnce(SUCCESS);
    await render();
    await chooseApplication("Basket Trading");
    await changeField("role_name", "Administrator");
    await submit();

    expect(container.textContent).toContain("temporary service failure");
    expect(datasourceAddRow).toHaveBeenCalledTimes(1);
    expect(endEditSession).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();

    await submit();

    expect(datasourceAddRow).toHaveBeenCalledTimes(1);
    expect(endEditSession).toHaveBeenCalledTimes(2);
    expect(endEditSession).toHaveBeenLastCalledWith(true, false);
    expect(close).toHaveBeenCalledOnce();
  });
});
