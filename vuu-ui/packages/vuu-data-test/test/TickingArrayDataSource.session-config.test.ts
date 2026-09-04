import { describe, expect, it } from "vitest";
import { simulModule } from "../src/simul/SimulModule";

// TickingArrayDataSource (the local/test datasource) ignores column
// restriction at construction time - it only takes effect via subscribe().
// Columns can't be asserted here, so these tests exercise the parts of the
// merge logic that ARE visible on this datasource type: table validation and
// discarding the inherited filterSpec. See VuuDataSource.test.ts for the
// column-restriction behaviour, which the remote datasource honours directly.
describe("TickingArrayDataSource session config (constructor-time)", () => {
  it("a call-time override's table is validated against the server-assigned session table's module", async () => {
    const ds = simulModule.createDataSource("instruments");
    await expect(
      ds.createSessionDataSource?.("All", "export", {
        table: { module: "WRONG_MODULE", table: "whatever" },
      }),
    ).rejects.toThrow(/does not match expected edit table module/);
  });

  it("the datasource's own session config is validated the same way as a call-time override", async () => {
    const ds = simulModule.createDataSource("instruments", undefined, {
      session: { table: { module: "WRONG_MODULE", table: "whatever" } },
    });
    await expect(
      ds.createSessionDataSource?.("All", "export"),
    ).rejects.toThrow(/does not match expected edit table module/);
  });

  it("without session.columns, the session inherits the source datasource's filterSpec", async () => {
    const ds = simulModule.createDataSource("instruments", undefined, {
      filterSpec: { filter: 'currency = "USD"' },
    });
    const session = await ds.createSessionDataSource?.("All", "export");
    expect(session?.config.filterSpec.filter).toBe('currency = "USD"');
  });

  it("with session.columns set, the session discards the source datasource's filterSpec", async () => {
    const ds = simulModule.createDataSource("instruments", undefined, {
      filterSpec: { filter: 'currency = "USD"' },
      session: { columns: ["ric", "currency"] },
    });
    const session = await ds.createSessionDataSource?.("All", "export");
    expect(session?.config.filterSpec).toEqual({ filter: "" });
  });

  it("with a call-time columns override, the session discards the source datasource's filterSpec", async () => {
    const ds = simulModule.createDataSource("instruments", undefined, {
      filterSpec: { filter: 'currency = "USD"' },
    });
    const session = await ds.createSessionDataSource?.("All", "export", {
      columns: ["ric", "currency"],
    });
    expect(session?.config.filterSpec).toEqual({ filter: "" });
  });

  it("a call-time override takes precedence over the datasource's own session config", async () => {
    const ds = simulModule.createDataSource("instruments", undefined, {
      session: { table: { module: "WRONG_MODULE", table: "whatever" } },
    });
    // The call-time override has no `table`, so it should win outright and
    // skip validation against the (invalid) session config's table.
    const session = await ds.createSessionDataSource?.("All", "export", {
      columns: ["ric"],
    });
    expect(session).toBeDefined();
  });
});

