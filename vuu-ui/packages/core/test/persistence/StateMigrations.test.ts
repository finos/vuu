import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type StateMigration,
  StateMigrationError,
  runStateMigrations,
  validateStateMigrations,
} from "../../src/persistence";
import { entry, stateDocument } from "./test-utils";

const v1 = () =>
  stateDocument({
    applicationKey: "orders",
    applicationVersion: 1,
    applicationTitle: "Orders",
    revision: 4,
    entries: {
      "table/sort": entry(
        { column: "price" },
        { label: "Sort order", group: "Table" },
      ),
      "table/columns": entry(["a", "b"], { label: "Columns", group: "Table" }),
      layout: entry({ split: 0.5 }),
    },
  });

describe("runStateMigrations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carries entries forward unchanged when there are no migrations", async () => {
    const source = v1();
    const { document, notifications } = await runStateMigrations(
      source,
      [],
      3,
      {
        now: "t",
      },
    );
    expect(document).toMatchObject({
      applicationVersion: 3,
      revision: 0,
      carriedForwardFrom: 1,
      migrationsApplied: [],
      createdAt: "t",
      applicationTitle: "Orders",
    });
    expect(document.entries).toEqual(source.entries);
    expect(document.notCarriedForward).toBeUndefined();
    expect(notifications).toEqual([]);
  });

  it("runs each applicable migration once, in ascending order", async () => {
    const calls: string[] = [];
    const migration = (version: number): StateMigration => ({
      version,
      migrate: (state) => {
        calls.push(`${version}:${state.fromVersion}->${state.toVersion}`);
      },
    });
    const { document } = await runStateMigrations(
      v1(),
      [migration(1), migration(3), migration(2)],
      3,
    );
    expect(calls).toEqual(["2:1->2", "3:2->3"]);
    expect(document.migrationsApplied).toEqual([2, 3]);
  });

  it("does not modify the source document", async () => {
    const source = v1();
    const before = JSON.stringify(source);
    await runStateMigrations(
      source,
      [
        {
          version: 2,
          migrate: (state) => {
            state.remove("layout");
            state.update<{ column: string }>("table/sort", (sort) => ({
              ...sort,
              column: "qty",
            }));
          },
        },
      ],
      2,
    );
    expect(JSON.stringify(source)).toBe(before);
  });

  it("supports set, rename, remove, has and keys", async () => {
    const { document } = await runStateMigrations(
      v1(),
      [
        {
          version: 2,
          migrate: (state) => {
            expect(state.keys()).toEqual([
              "table/sort",
              "table/columns",
              "layout",
            ]);
            state.rename("table/columns", "grid/columns");
            state.remove("layout");
            state.set("grid/density", "compact", { label: "Density" });
            expect(state.has("layout")).toBe(false);
            expect(state.get("grid/columns")).toEqual(["a", "b"]);
          },
        },
      ],
      2,
      { now: "t" },
    );
    expect(Object.keys(document.entries).sort()).toEqual([
      "grid/columns",
      "grid/density",
      "table/sort",
    ]);
    expect(document.entries["grid/columns"].label).toBe("Columns");
    expect(document.entries["grid/density"]).toMatchObject({
      value: "compact",
      label: "Density",
      updatedAt: "t",
    });
  });

  it("records rejected entries as not carried forward", async () => {
    const { document } = await runStateMigrations(
      v1(),
      [
        {
          version: 2,
          migrate: (state) => {
            state.update("table/sort", (_value, entry) =>
              entry.reject("Sorting has changed"),
            );
          },
        },
      ],
      2,
    );
    expect(document.entries["table/sort"]).toBeUndefined();
    expect(document.notCarriedForward).toEqual([
      {
        key: "table/sort",
        label: "Sort order",
        group: "Table",
        fromVersion: 1,
        reason: "Sorting has changed",
      },
    ]);
  });

  it("isolates errors inside update to that entry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { document } = await runStateMigrations(
      v1(),
      [
        {
          version: 2,
          migrate: (state) => {
            state.update("table/sort", () => {
              throw Error("boom");
            });
            state.update("table/columns", () => (() => 1) as never);
            state.update<{ split: number }>("layout", (layout) => ({
              split: layout.split * 2,
            }));
            state.update("missing", () => {
              throw Error("never called");
            });
          },
        },
      ],
      2,
    );
    expect(document.entries.layout.value).toEqual({ split: 1 });
    expect(document.notCarriedForward?.map(({ key }) => key)).toEqual([
      "table/sort",
      "table/columns",
    ]);
    expect(document.notCarriedForward?.[0].reason).toBe(
      "It couldn't be updated for the new version",
    );
  });

  it("collects notify messages", async () => {
    const { document, notifications } = await runStateMigrations(
      v1(),
      [
        {
          version: 2,
          migrate: (state) => {
            state.update("layout", (value, entry) => {
              entry.notify("Your layout has been reset to fit the new panels.");
              return value;
            });
          },
        },
      ],
      2,
    );
    expect(notifications).toEqual([
      "Your layout has been reset to fit the new panels.",
    ]);
    expect(document.entries.layout).toBeDefined();
  });

  it("aborts when a migration throws outside update", async () => {
    await expect(
      runStateMigrations(
        v1(),
        [
          {
            version: 2,
            migrate: async () => {
              throw Error("bad");
            },
          },
        ],
        2,
      ),
    ).rejects.toMatchObject({ name: "StateMigrationError", version: 2 });
  });

  it("rejects invalid migration lists", () => {
    const migrate = () => undefined;
    expect(() =>
      validateStateMigrations(
        [
          { version: 2, migrate },
          { version: 2, migrate },
        ],
        3,
      ),
    ).toThrow(StateMigrationError);
    expect(() => validateStateMigrations([{ version: 4, migrate }], 3)).toThrow(
      StateMigrationError,
    );
    expect(() =>
      validateStateMigrations([{ version: 1.5, migrate }], 3),
    ).toThrow(StateMigrationError);
    expect(() =>
      validateStateMigrations([{ version: 2, migrate }], 3),
    ).not.toThrow();
  });

  it("refuses to migrate backwards", async () => {
    await expect(runStateMigrations(v1(), [], 1)).rejects.toBeInstanceOf(
      StateMigrationError,
    );
  });
});
