import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { describe, expect, it, vi } from "vitest";
import { ChartDataStore } from "../src/chart-data/ChartDataStore";

const createDataSource = (count: number) =>
  new ArrayDataSource({
    columnDescriptors: [
      { name: "id", serverDataType: "string" },
      { name: "price", serverDataType: "double" },
    ],
    data: Array.from({ length: count }, (_, i) => [`id-${i}`, 100 + i]),
    keyColumn: "id",
  });

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ChartDataStore", () => {
  it("subscribes once and collects rows in index order", async () => {
    const dataSource = createDataSource(5);
    const subscribe = vi.spyOn(dataSource, "subscribe");
    const store = new ChartDataStore(dataSource);
    const onUpdate = vi.fn();
    store.on("update", onUpdate);
    store.subscribe();
    store.subscribe();
    expect(subscribe).toHaveBeenCalledTimes(1);
    await nextTick();
    expect(store.isSubscribed).toBe(true);
    expect(onUpdate).toHaveBeenCalled();
    expect(store.size).toBe(5);
    expect(store.rows.map((row) => store.getValue(row, "price"))).toEqual([
      100, 101, 102, 103, 104,
    ]);
    expect(store.getValue(store.rows[0], "unknown")).toBeUndefined();
    store.dispose();
  });

  it("caps rows at maxRows", async () => {
    const dataSource = createDataSource(20);
    const store = new ChartDataStore(dataSource, { maxRows: 10 });
    store.subscribe();
    await nextTick();
    expect(store.rows).toHaveLength(10);
    store.dispose();
  });

  it("unsubscribes and releases rows and listeners on dispose", async () => {
    const dataSource = createDataSource(5);
    const unsubscribe = vi.spyOn(dataSource, "unsubscribe");
    const store = new ChartDataStore(dataSource);
    const onUpdate = vi.fn();
    store.on("update", onUpdate);
    store.subscribe();
    await nextTick();
    store.dispose();
    store.dispose();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(store.isSubscribed).toBe(false);
    expect(store.rows).toHaveLength(0);
    onUpdate.mockClear();
    store.emit("update");
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
