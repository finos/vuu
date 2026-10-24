import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import { metadataKeys, Range } from "@vuu-ui/vuu-utils";
import type { BasketModule } from "../src/basket/BasketModule";
import type { BasketsTableName } from "../src/basket/basket-schemas";
import constituents from "../src/basket/reference-data/constituents.json";

let module: BasketModule;

const dataSource = (table: BasketsTableName, viewport: string) => {
  const source = module.createDataSource(table, viewport, {
    columns: module.schemas[table].columns.map(({ name }) => name),
  });
  if (!(source instanceof TickingArrayDataSource)) {
    throw Error("Expected a ticking datasource");
  }
  return source;
};

const createBasket = async (name: string, sourceBasketId = ".NASDAQ100") => {
  const result = await dataSource("basket", `create-${name}`).rpcRequest({
    type: "RPC_REQUEST",
    rpcName: "createBasket",
    params: { sourceBasketId, basketTradeName: name },
  });
  expect(result.type).toBe("SUCCESS_RESULT");
  return String(result.data);
};

describe("BasketModule", () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    ({ basketModule: module } = await import("../src/basket/BasketModule"));
  });

  afterAll(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates schema-aligned constituent rows and supports direct edits through the join", async () => {
    const instanceId = await createBasket("editable");
    const trading = module.tables.basketTrading;
    expect(trading.findByKey(instanceId)?.[trading.map.basketName]).toBe(
      "editable",
    );
    const source = module.tables.basketTradingConstituent;
    const joined = module.tables.basketTradingConstituentJoin;
    expect(joined.schema.key).toBe("instanceIdRic");
    const row = source.data.find(
      (row) => row[source.map.instanceId] === instanceId,
    );
    expect(row).toBeDefined();
    const key = String(row?.[source.map.instanceIdRic]);
    expect(row?.[source.map.status]).toBe("OFF-MARKET");
    expect(row?.[source.map.venue]).toBe("venue");
    expect(row?.[source.map.weighting]).toEqual(expect.any(Number));
    expect(
      source.data
        .filter((row) => row[source.map.instanceId] === instanceId)
        .every((row) => row[source.map.priceStrategyId] === 2),
    ).toBe(true);

    const ds = dataSource("basketTradingConstituentJoin", "edit-join");
    const messages = vi.fn();
    await ds.subscribe({ range: Range(0, 20) }, messages);
    expect(ds.currentData.map((row) => row[metadataKeys.KEY])).toEqual(
      joined.data.map((row) => String(row[joined.map.instanceIdRic])),
    );
    messages.mockClear();
    const result = await ds.editCell(key, "quantity", 12345);
    await vi.advanceTimersByTimeAsync(20);
    expect(result).toEqual({ type: "SUCCESS_RESULT", data: undefined });
    expect(source.findByKey(key)?.[source.map.quantity]).toBe(12345);
    expect(joined.findByKey(key)?.[joined.map.quantity]).toBe(12345);
    expect(messages).toHaveBeenCalled();

    expect(await ds.editCell(key, "priceStrategyId", 1)).toEqual({
      type: "SUCCESS_RESULT",
      data: undefined,
    });
    expect(source.findByKey(key)?.[source.map.priceStrategyId]).toBe(1);
    ds.unsubscribe();
  });

  it("loads generated CSV weights and initializes quantities for all baskets", async () => {
    const reference = module.tables.basketConstituent;
    const trading = module.tables.basketTradingConstituent;
    expect(reference.data).toHaveLength(constituents.length);
    for (const basketId of [".FTSE100", ".HSI", ".NASDAQ100", ".SP500"]) {
      const instanceId = await createBasket(`csv-${basketId}`, basketId);
      const records = constituents.filter((row) => row.basketId === basketId);
      expect(records.length).toBeGreaterThan(0);
      for (const record of records) {
        const source = reference.findByKey(record.ricBasketId);
        expect(source?.[reference.map.weighting]).toBe(record.weighting);
        const row = trading.findByKey(`${instanceId}-${record.ric}`);
        expect(row?.[trading.map.weighting]).toBe(record.weighting);
        expect(row?.[trading.map.quantity]).toBe(
          Math.trunc(record.weighting * 100),
        );
      }
    }
  });

  it("adds a constituent only to the requested basket and rejects invalid additions", async () => {
    const instanceId = await createBasket("drop-target", ".FTSE100");
    const otherId = await createBasket("other-drop-target", ".FTSE100");
    module.tables.basketTrading.update(instanceId, "units", 250);
    const ds = dataSource("basketTradingConstituentJoin", "drop-join");
    const add = (ric: string, basketInstanceId = instanceId) =>
      ds.rpcRequest({
        type: "RPC_REQUEST",
        rpcName: "addConstituent",
        params: { ric, basketInstanceId },
      });
    const source = module.tables.basketTradingConstituent;
    const join = module.tables.basketTradingConstituentJoin;
    expect(await add("AAPL")).toEqual({
      type: "SUCCESS_RESULT",
      data: `${instanceId}-AAPL`,
    });
    const row = source.findByKey(`${instanceId}-AAPL`);
    expect(row?.[source.map.quantity]).toBe(25);
    expect(row?.[source.map.weighting]).toBe(0.1);
    expect(row?.[source.map.priceStrategyId]).toBe(2);
    expect(join.findByKey(`${instanceId}-AAPL`)).toBeDefined();
    expect(source.findByKey(`${otherId}-AAPL`)).toBeUndefined();
    expect((await add("AAPL")).type).toBe("ERROR_RESULT");
    expect((await add("NOT-A-RIC")).type).toBe("ERROR_RESULT");
    expect((await add("MSFT", "missing")).type).toBe("ERROR_RESULT");
    module.tables.basketTrading.update(instanceId, "status", "ON_MARKET");
    expect((await add("MSFT")).type).toBe("ERROR_RESULT");
  });

  it("returns lookup rows on the first subscription with columns and a range", async () => {
    for (const [table, label] of [
      ["priceStrategyType", "priceStrategy"],
      ["algoType", "algoType"],
    ] as const) {
      const ds = dataSource(table, `lookup-${table}`);
      const messages = vi.fn();
      await ds.subscribe(
        {
          columns: ["id", label],
          range: Range(0, 100),
        },
        messages,
      );
      await vi.advanceTimersByTimeAsync(0);
      const update = messages.mock.calls.find(
        ([message]) => message.type === "viewport-update" && message.rows,
      )?.[0];
      expect(update?.rows).toHaveLength(module.tables[table].data.length);
      expect(update?.rows[0].slice(metadataKeys.count)).toEqual(
        table === "priceStrategyType"
          ? [0, "Peg to Near Touch"]
          : [0, "Sniper"],
      );
      ds.unsubscribe();
    }
  });

  it("flips each constituent side only when its parent basket side changes", async () => {
    const instanceId = await createBasket("mixed-sides");
    const otherId = await createBasket("other-sides");
    const source = module.tables.basketTradingConstituent;
    const joined = module.tables.basketTradingConstituentJoin;
    const rows = source.data.filter(
      (row) => row[source.map.instanceId] === instanceId,
    );
    const keys = rows.map((row) => String(row[source.map.instanceIdRic]));
    const constituents = dataSource(
      "basketTradingConstituentJoin",
      "side-constituents",
    );
    const basket = dataSource("basketTrading", "side-basket");
    const messages = vi.fn();
    await constituents.subscribe(
      {
        range: Range(0, 1, 20),
        filterSpec: { filter: `instanceId = "${instanceId}"` },
      },
      messages,
    );
    constituents.range = Range(0, 1, 20);
    await basket.subscribe({ range: Range(0, 20) }, vi.fn());
    expect(await constituents.editCell(keys[0], "side", "SELL")).toEqual({
      type: "SUCCESS_RESULT",
      data: undefined,
    });
    const originalSides = keys.map(
      (key) => source.findByKey(key)?.[source.map.side],
    );
    expect(originalSides).toContain("BUY");
    expect(originalSides).toContain("SELL");
    messages.mockClear();

    for (const side of ["SELL", "SELL", "BUY", "BUY"]) {
      expect(await basket.editCell(instanceId, "side", side)).toEqual({
        type: "SUCCESS_RESULT",
        data: undefined,
      });
      expect(
        module.tables.basketTrading.findByKey(instanceId)?.[
          module.tables.basketTrading.map.side
        ],
      ).toBe(side);
      keys.forEach((key, index) => {
        const expected =
          side === "BUY"
            ? originalSides[index]
            : originalSides[index] === "BUY"
              ? "SELL"
              : "BUY";
        expect(source.findByKey(key)?.[source.map.side]).toBe(expected);
        expect(joined.findByKey(key)?.[joined.map.side]).toBe(expected);
      });
      expect(
        source.data
          .filter((row) => row[source.map.instanceId] === otherId)
          .every((row) => row[source.map.side] === "BUY"),
      ).toBe(true);
    }
    expect(
      messages.mock.calls.some(([message]) =>
        message.rows?.some(
          (row: unknown[]) => row[metadataKeys.KEY] === keys[1],
        ),
      ),
    ).toBe(true);
    constituents.unsubscribe();
    basket.unsubscribe();
  });

  it("recalculates constituent quantities when basket units change", async () => {
    const instanceId = await createBasket("unit-changes");
    const otherId = await createBasket("other-units");
    const source = module.tables.basketTradingConstituent;
    const joined = module.tables.basketTradingConstituentJoin;
    const rows = source.data.filter(
      (row) => row[source.map.instanceId] === instanceId,
    );
    const key = String(rows[0][source.map.instanceIdRic]);
    source.update(key, "weighting", 0.125);
    const otherRows = source.data
      .filter((row) => row[source.map.instanceId] === otherId)
      .map((row) => row[source.map.quantity]);
    const basket = dataSource("basketTrading", "units-basket");
    await basket.subscribe({ range: Range(0, 100) }, vi.fn());
    expect(await basket.editCell(instanceId, "units", 123)).toEqual({
      type: "SUCCESS_RESULT",
      data: undefined,
    });
    for (const row of rows) {
      const key = String(row[source.map.instanceIdRic]);
      const expected = Math.trunc(
        Number(source.findByKey(key)?.[source.map.weighting]) * 123,
      );
      expect(source.findByKey(key)?.[source.map.quantity]).toBe(expected);
      expect(joined.findByKey(key)?.[joined.map.quantity]).toBe(expected);
    }
    expect(source.findByKey(key)?.[source.map.quantity]).toBe(15);
    source.update(key, "quantity", 999);
    await basket.editCell(instanceId, "units", 123);
    expect(source.findByKey(key)?.[source.map.quantity]).toBe(999);
    expect(
      source.data
        .filter((row) => row[source.map.instanceId] === otherId)
        .map((row) => row[source.map.quantity]),
    ).toEqual(otherRows);
    basket.unsubscribe();
  });

  it("ticks prices for every basket instance sharing a ric without overwriting edits", async () => {
    const first = await createBasket("first-ticking");
    const second = await createBasket("second-ticking");
    const joined = module.tables.basketTradingConstituentJoin;
    const row = joined.data.find((row) => row[joined.map.instanceId] === first);
    expect(row).toBeDefined();
    const ric = String(row?.[joined.map.ric]);
    const key1 = `${first}-${ric}`;
    const key2 = `${second}-${ric}`;
    const ds = dataSource("basketTradingConstituentJoin", "ticking-join");
    const messages = vi.fn();
    await ds.subscribe({ range: Range(0, 20) }, messages);
    await ds.editCell(key1, "quantity", 45678);
    await vi.advanceTimersByTimeAsync(0);
    messages.mockClear();
    const oldBid = joined.findByKey(key1)?.[joined.map.bid];
    const updates = vi.fn();
    joined.on("update", updates);
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    await vi.advanceTimersByTimeAsync(1000);

    expect(updates).toHaveBeenCalled();
    expect(messages).toHaveBeenCalled();
    const row1 = joined.findByKey(key1);
    const row2 = joined.findByKey(key2);
    expect(row1?.[joined.map.bid]).not.toBe(oldBid);
    expect(row1?.[joined.map.bid]).toEqual(row2?.[joined.map.bid]);
    expect(row1?.[joined.map.ask]).toEqual(row2?.[joined.map.ask]);
    expect(row1?.[joined.map.quantity]).toBe(45678);
    joined.removeListener("update", updates);
    ds.unsubscribe();
  });

  it("provides the live grid fields and updates constituent status with the basket", async () => {
    const instanceId = await createBasket("live");
    const source = dataSource("basketTrading", "market-actions");
    const joined = module.tables.basketTradingConstituentJoin;
    const rows = () =>
      joined.data.filter((row) => row[joined.map.instanceId] === instanceId);
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().every((row) => row[joined.map.filledQty] === 0)).toBe(true);

    for (const [rpcName, status] of [
      ["sendToMarket", "ACKED"],
      ["takeOffMarket", "CANCELLED"],
    ]) {
      expect(
        await source.rpcRequest({
          type: "RPC_REQUEST",
          rpcName,
          params: { basketInstanceId: instanceId },
        }),
      ).toEqual({ type: "SUCCESS_RESULT", data: undefined });
      expect(
        rows().every((row) => row[joined.map.orderStatus] === status),
      ).toBe(true);
    }
  });
});
