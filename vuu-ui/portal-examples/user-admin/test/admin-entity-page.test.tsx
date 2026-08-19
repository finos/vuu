import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntityPage } from "../src/components/EntityPage";
import type { AdminRecord } from "../src/data/admin-contract";

const mocks = vi.hoisted(() => ({ select: vi.fn(), form: vi.fn() }));
vi.mock("../src/data/useAdminTable", () => ({
  useAdminTable: () => ({
    loading: false,
    dataSource: { select: mocks.select },
    schema: {
      table: { module: "KEYCLOAK_ADMIN", table: "users" },
      key: "user_id",
      columns: [
        { name: "user_id", serverDataType: "string" },
        { name: "username", serverDataType: "string" },
      ],
    },
  }),
}));
vi.mock("../src/components/AdminTable", () => ({
  AdminTable: () => <p>Relationship table</p>,
  AdminTableView: ({
    selectionDisabled,
    onSelect,
  }: {
    selectionDisabled?: boolean;
    onSelect: (record?: AdminRecord) => void;
  }) => (
    <div>
      <button
        type="button"
        data-testid="select"
        disabled={selectionDisabled}
        onClick={() =>
          onSelect({
            key: "u1",
            user_id: "u1",
            username: "Alice",
            first_name: "Alice",
            last_name: "Example",
            email: "alice@example.com",
            email_verified: true,
            password_update_required: false,
            group_count: 2,
            role_count: 3,
          })
        }
      >
        Select Alice
      </button>
      <button
        type="button"
        data-testid="clear"
        disabled={selectionDisabled}
        onClick={() => onSelect(undefined)}
      >
        Clear selection
      </button>
    </div>
  ),
}));
vi.mock("../src/components/AdminEditForm", () => ({
  AdminEditForm: ({
    record,
    onClose,
  }: {
    record?: AdminRecord;
    onClose: () => void;
  }) => {
    mocks.form(record);
    return (
      <button type="button" data-testid="discard" onClick={onClose}>
        Discard
      </button>
    );
  },
}));

describe("entity panel modes", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.select.mockClear();
    mocks.form.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });
  const click = async (selector: string) => {
    const button = container.querySelector<HTMLButtonElement>(selector);
    if (!button) throw new Error(`Missing control ${selector}`);
    await act(async () => button.click());
  };
  it("selection remains read-only; editing disables selection and closes via the editor", async () => {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <EntityPage entity="users" />
        </MemoryRouter>,
      ),
    );
    expect(mocks.form).not.toHaveBeenCalled();
    await click('[data-testid="select"]');
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Example");
    expect(container.textContent).toContain("alice@example.com");
    expect(container.textContent).toContain("email verified");
    expect(container.textContent).toContain("password update required");
    expect(container.textContent).toContain("group count");
    expect(container.textContent).toContain("role count");
    expect(mocks.form).not.toHaveBeenCalled();
    const edit = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Edit user",
    );
    if (!edit) throw new Error("Missing Edit user action");
    await act(async () => edit.click());
    expect(mocks.form).toHaveBeenLastCalledWith(
      expect.objectContaining({ user_id: "u1" }),
    );
    expect(
      container.querySelector<HTMLButtonElement>('[data-testid="select"]')
        ?.disabled,
    ).toBe(true);
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
    await click('[data-testid="discard"]');
    expect(mocks.select).toHaveBeenCalledWith({ type: "DESELECT_ALL" });
    expect(container.querySelector('[data-testid="discard"]')).toBeNull();
  });
  it("quick-action create opens an empty editor and removes the create flag on close", async () => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={["/?create=true"]}>
          <EntityPage entity="users" />
        </MemoryRouter>,
      ),
    );
    expect(mocks.form).toHaveBeenLastCalledWith(undefined);
    await click('[data-testid="discard"]');
    expect(container.querySelector('[data-testid="discard"]')).toBeNull();
    expect(
      container.querySelector<HTMLButtonElement>('[data-testid="select"]')
        ?.disabled,
    ).toBe(false);
  });
});
