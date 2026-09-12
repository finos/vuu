import type { TableSchema } from "@vuu-ui/vuu-data-types";
import { describe, expect, it } from "vitest";
import {
  buildFilter,
  columnFor,
  displayColumnsFor,
  hasField,
  tableFor,
} from "../src/data/admin-contract";

const schema: TableSchema = {
  key: "id",
  table: { module: "IDENTITY", table: "accounts" },
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "login", serverDataType: "string" },
    { name: "email", serverDataType: "string" },
  ],
};
const config = {
  users: { table: schema.table, columns: { username: "login", user_id: "id" } },
};

describe("server-driven identity contract", () => {
  it("uses configured table and columns without inventing a schema", () => {
    expect(tableFor(config, "users")).toEqual(schema.table);
    expect(tableFor(config, "roles")).toEqual({
      module: "KEYCLOAK_ADMIN",
      table: "roles",
    });
    expect(columnFor(config, "users", "username")).toBe("login");
    expect(hasField(schema, config, "users", "first_name")).toBe(false);
  });

  it("hides identity columns from rendering while retaining them in the schema", () => {
    const identitySchema: TableSchema = {
      ...schema,
      columns: [
        { name: "user_id", serverDataType: "string" },
        { name: "username", serverDataType: "string" },
        { name: "vuuMsg", serverDataType: "string" },
      ],
    };

    expect(displayColumnsFor(identitySchema, {}, "users").map(({ name }) => name))
      .toEqual(["username"]);
    expect(identitySchema.columns.map(({ name }) => name)).toEqual([
      "user_id",
      "username",
      "vuuMsg",
    ]);
  });

  it("applies configured hidden columns using logical or server names", () => {
    const configuredSchema: TableSchema = {
      ...schema,
      columns: [
        { name: "stable_id", serverDataType: "string" },
        { name: "login", serverDataType: "string" },
        { name: "email", serverDataType: "string" },
      ],
    };
    const configured = {
      users: {
        columns: { user_id: "stable_id", username: "login" },
        columnConfig: { hidden: ["user_id", "email"] },
      },
    };

    expect(
      displayColumnsFor(configuredSchema, configured, "users").map(
        ({ name }) => name,
      ),
    ).toEqual(["login"]);
  });

  it("builds cross-column search only from fields present in server schema", () => {
    expect(
      buildFilter(schema, config, "users", { search: "  alice  " }),
    ).toEqual({
      op: "or",
      filters: [
        { op: "contains", column: "login", value: "alice" },
        { op: "contains", column: "email", value: "alice" },
      ],
    });
    expect(
      buildFilter(schema, config, "users", { search: " " }),
    ).toBeUndefined();
  });

  it("keeps relationship predicates combined with search", () => {
    expect(
      buildFilter(schema, config, "users", {
        search: "a",
        equals: { field: "user_id", value: "123" },
      }),
    ).toMatchObject({
      op: "and",
      filters: [{ op: "=", column: "id", value: "123" }, { op: "or" }],
    });
  });

  it("fails closed when a required relationship column is unavailable", () => {
    expect(() =>
      buildFilter(schema, {}, "user_groups", {
        equals: { field: "user_id", value: "a" },
      }),
    ).toThrow('missing required column "user_id"');
  });

  it("reports unavailable search instead of loading an unfiltered table", () => {
    expect(() =>
      buildFilter(
        { ...schema, columns: [{ name: "id", serverDataType: "string" }] },
        {},
        "roles",
        { search: "admin" },
      ),
    ).toThrow("No searchable columns");
  });

  it.each([
    'a" or enabled = true',
    "a\\b",
    "a\nb",
    "a\tb",
  ])("rejects unsupported filter literal %j", (search) => {
    expect(() => buildFilter(schema, config, "users", { search })).toThrow(
      "Search values cannot contain",
    );
  });
});
