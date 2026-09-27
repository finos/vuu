import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditModeProvider, EditSession } from "@vuu-ui/vuu-data-editing";
import { RolesEditForm } from "../src/components/roles-edit-form/RolesEditForm";

const mocks = vi.hoisted(() => ({
  clients: [
    {
      label: "Vuu Portal",
      value: "client-1",
      metadata: { client_identifier: "vuu-portal" },
    },
    {
      label: "Account Console",
      value: "client-2",
      metadata: { client_identifier: "account" },
    },
  ],
  notify: vi.fn(),
}));

vi.mock("@vuu-ui/vuu-data-editing", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vuu-ui/vuu-data-editing")>()),
  useLookupValues: () => mocks.clients,
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
      children,
      onSelectionChange,
      value,
    }: {
      children: React.ReactNode;
      onSelectionChange: (
        event: React.SyntheticEvent,
        options: typeof mocks.clients,
      ) => void;
      value: string;
    }) => {
      const options = React.Children.toArray(children).flatMap((child) =>
        React.isValidElement<{
          children: React.ReactNode;
          value: (typeof mocks.clients)[number];
        }>(child)
          ? [child.props]
          : [],
      );
      return React.createElement(
        "select",
        {
          "aria-label": "Client",
          value,
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selected = options.find(
              ({ value: option }) => option.label === event.currentTarget.value,
            )?.value;
            if (selected) onSelectionChange(event, [selected]);
          },
        },
        ...options.map(({ value: option }) =>
          React.createElement(
            "option",
            { key: option.value, value: option.label },
            option.label,
          ),
        ),
      );
    },
  };
});

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

  const render = async () => {
    await act(async () => {
      root.render(
        <EditModeProvider isEditMode>
          <RolesEditForm
            dataRow={newRoleRow}
            dataSource={dataSource}
            onClose={close}
          />
        </EditModeProvider>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  const chooseClient = async (label: string) => {
    const select = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Client"]',
    );
    if (!select) throw new Error("Missing client dropdown");
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
    await chooseClient("Vuu Portal");
    await changeField("role_name", "Administrator");
    await changeField("description", "Administrative access");

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();
    expect(endEditSession).not.toHaveBeenCalled();

    await submit();

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).toHaveBeenCalledTimes(1);
    expect(datasourceAddRow).toHaveBeenCalledWith({
      client_id: "client-1",
      client_identifier: "vuu-portal",
      client_name: "Vuu Portal",
      description: "Administrative access",
      role_name: "Administrator",
    });
    expect(endEditSession).toHaveBeenCalledWith(true, false);
    expect(close).toHaveBeenCalledOnce();
  });

  it("includes an empty optional description in the staged role row", async () => {
    await render();
    await chooseClient("Vuu Portal");
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
    await chooseClient("Vuu Portal");
    await changeField("role_name", "Administrator");
    await click("Cancel");

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();
    expect(endEditSession).toHaveBeenCalledWith(false, false);
    expect(close).toHaveBeenCalledOnce();
  });

  it("requires both a role name and a client before insertion", async () => {
    await render();
    await submit();

    expect(container.textContent).toContain("Role name is required.");
    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();

    await changeField("role_name", "Administrator");
    expect(container.textContent).not.toContain("Role name is required.");
    await submit();

    expect(container.textContent).toContain("Client is required.");
    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).not.toHaveBeenCalled();
  });

  it("allows roles to be created for any selected client", async () => {
    await render();
    const clientSelect = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Client"]',
    );
    expect(
      [...(clientSelect?.options ?? [])].map(({ textContent }) => textContent),
    ).toEqual(["Vuu Portal", "Account Console"]);

    await chooseClient("Account Console");
    await changeField("role_name", "Administrator");
    await submit();

    expect(rpcRequest).not.toHaveBeenCalled();
    expect(datasourceAddRow).toHaveBeenCalledWith({
      client_id: "client-2",
      client_identifier: "account",
      client_name: "Account Console",
      description: "",
      role_name: "Administrator",
    });
    expect(endEditSession).toHaveBeenCalledWith(true, false);
  });

  it("keeps the staged row after a session-save failure and retries without adding twice", async () => {
    endEditSession
      .mockRejectedValueOnce(new Error("temporary service failure"))
      .mockResolvedValueOnce(SUCCESS);
    await render();
    await chooseClient("Vuu Portal");
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
