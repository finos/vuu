import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { RelationshipSummary } from "../src/components/RelationshipSummary";
import { AdminDataContext } from "../src/data/AdminDataContext";
import type {
  AdminQuery,
  AdminTableName,
  Entity,
} from "../src/data/admin-contract";

vi.mock("../src/components/AdminTable", () => ({
  AdminTable: ({
    name,
    query,
  }: {
    name: AdminTableName;
    query: AdminQuery;
  }) => <output data-table={name}>{JSON.stringify(query)}</output>,
}));

describe("relationship summary filters", () => {
  it.each<{ entity: Entity; id: string; tables: string[] }>([
    {
      entity: "users",
      id: "user_id",
      tables: ["user_groups", "user_group_roles"],
    },
    {
      entity: "groups",
      id: "group_id",
      tables: ["user_groups", "group_roles"],
    },
    {
      entity: "roles",
      id: "role_id",
      tables: ["group_roles", "user_group_roles"],
    },
  ])("shows only $entity relationships by stable server ID", async ({
    entity,
    id,
    tables,
  }) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          <AdminDataContext.Provider
            value={{ [entity]: { columns: { [id]: "stable_id" } } }}
          >
            <RelationshipSummary
              entity={entity}
              record={{ stable_id: "123", key: "row-key" }}
            />
          </AdminDataContext.Provider>,
        ),
      );
      expect(
        [...container.querySelectorAll("output")].map(
          (table) => table.dataset.table,
        ),
      ).toEqual(tables);
      for (const table of container.querySelectorAll("output")) {
        expect(JSON.parse(table.textContent ?? "")).toEqual({
          equals: { field: id, value: "123" },
        });
      }
      await act(async () =>
        root.render(
          <RelationshipSummary entity={entity} record={{ key: "row-key" }} />,
        ),
      );
      expect(container.querySelectorAll("output")).toHaveLength(0);
      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        id,
      );
    } finally {
      act(() => root.unmount());
      vi.unstubAllGlobals();
    }
  });
});
