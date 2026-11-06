import type {
  DataSource,
  DataSourceStatus,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { metadataKeys, Range } from "@vuu-ui/vuu-utils";
import { describe, expect, it, vi } from "vitest";
import { ChartSeries } from "../src/ChartSeries";

/**
 * Minimal DataSource that enforces status transitions the way
 * VuuDataSource does: subscribe throws unless the DataSource is new or
 * unsubscribed, resume only sends rows when suspended.
 */
class FakeDataSource {
  status: DataSourceStatus = "initialising";
  columns = ["id", "date", "price"];
  callback: DataSourceSubscribeCallback | undefined;
  rangeHistory: Range[] = [];
  #range = Range(0, 0);

  get range() {
    return this.#range;
  }
  set range(range: Range) {
    this.#range = range;
    this.rangeHistory.push(range);
  }

  subscribe = vi.fn(
    ({ range }: { range?: Range }, callback: DataSourceSubscribeCallback) => {
      if (this.status !== "initialising" && this.status !== "unsubscribed") {
        throw Error(`subscribe called with status ${this.status}`);
      }
      this.callback = callback;
      if (range) {
        this.#range = range;
      }
      this.status = "subscribed";
    },
  );
  unsubscribe = vi.fn(() => {
    this.status = "unsubscribed";
  });
  suspend = vi.fn(() => {
    if (this.status !== "unsubscribed") {
      this.status = "suspended";
    }
  });
  resume = vi.fn((callback?: DataSourceSubscribeCallback) => {
    if (callback) {
      this.callback = callback;
    }
    if (this.status === "suspended") {
      this.status = "subscribed";
      this.sendRows();
    }
  });

  sendRows() {
    const { from, to } = this.#range;
    const rows = [];
    for (let i = from; i < Math.min(to, 3); i++) {
      const row: unknown[] = Array(metadataKeys.count).fill(0);
      row[metadataKeys.IDX] = i;
      row[metadataKeys.KEY] = `key-${i}`;
      rows.push([...row, i, `d${i}`, 10 + i]);
    }
    this.callback?.({
      clientViewportId: "vp1",
      mode: "batch",
      rows,
      type: "viewport-update",
    } as Parameters<DataSourceSubscribeCallback>[0]);
  }
}

const createChartSeries = (dataSource: FakeDataSource) => {
  const cs = new ChartSeries({
    config: {},
    dataSource: dataSource as unknown as DataSource,
    palette: ["c1", "c2"],
  });
  cs.categoryColumn = "date";
  cs.seriesColumnNames = ["price"];
  return cs;
};

describe("ChartSeries DataSource lifecycle", () => {
  it("does not subscribe until subscribe is called", () => {
    const ds = new FakeDataSource();
    createChartSeries(ds);
    expect(ds.subscribe).not.toHaveBeenCalled();
  });

  it("subscribes a new DataSource with the chart range", () => {
    const ds = new FakeDataSource();
    const cs = createChartSeries(ds);
    cs.subscribe();
    expect(ds.subscribe).toHaveBeenCalledTimes(1);
    expect(ds.range).toEqual(Range(0, 1000));
  });

  it("suspends on release, never unsubscribes", () => {
    const ds = new FakeDataSource();
    const cs = createChartSeries(ds);
    cs.subscribe();
    cs.release();
    expect(ds.suspend).toHaveBeenCalledTimes(1);
    expect(ds.unsubscribe).not.toHaveBeenCalled();
    expect(ds.status).toBe("suspended");
  });

  it("passes escalateToDisable to suspend", () => {
    const ds = new FakeDataSource();
    const cs = createChartSeries(ds);
    cs.subscribe();
    cs.release(false);
    expect(ds.suspend).toHaveBeenCalledWith(false);
  });

  it("resumes a DataSource suspended by another component, with the chart range", () => {
    const ds = new FakeDataSource();
    // e.g. a Table subscribed with its own range, then unmounted
    ds.subscribe({ range: Range(0, 20) }, () => undefined);
    ds.suspend();

    const cs = createChartSeries(ds);
    cs.subscribe();
    expect(ds.subscribe).toHaveBeenCalledTimes(1);
    expect(ds.resume).toHaveBeenCalledTimes(1);
    expect(ds.range).toEqual(Range(0, 1000));
    expect(ds.status).toBe("subscribed");
    // rows sent on resume are charted, the column map is taken from the
    // DataSource as there is no subscribed message
    expect(cs.series[0].data.map(({ value }) => value)).toEqual([10, 11, 12]);
  });

  it("restores the previous range on release", () => {
    const ds = new FakeDataSource();
    ds.subscribe({ range: Range(0, 20) }, () => undefined);
    ds.suspend();

    const cs = createChartSeries(ds);
    cs.subscribe();
    cs.release();
    expect(ds.range).toEqual(Range(0, 20));
    expect(ds.status).toBe("suspended");
  });

  it("suspends before restoring the range, so rows for that range are not charted", () => {
    const ds = new FakeDataSource();
    ds.subscribe({ range: Range(0, 20) }, () => undefined);
    ds.suspend();
    const cs = createChartSeries(ds);
    cs.subscribe();
    const order: string[] = [];
    ds.suspend.mockImplementationOnce(() => {
      order.push(`suspend:${ds.status}`);
      ds.status = "suspended";
    });
    const rangeCountBefore = ds.rangeHistory.length;
    cs.release();
    expect(order).toEqual(["suspend:subscribed"]);
    expect(ds.rangeHistory.length).toBe(rangeCountBefore + 1);
  });

  it("forces a snapshot when taking over a DataSource that is still subscribed", () => {
    const ds = new FakeDataSource();
    ds.subscribe({ range: Range(0, 20) }, () => undefined);

    const cs = createChartSeries(ds);
    cs.subscribe();
    expect(ds.subscribe).toHaveBeenCalledTimes(1);
    expect(ds.suspend).toHaveBeenCalledWith(false);
    expect(ds.resume).toHaveBeenCalledTimes(1);
    expect(cs.series[0].data).toHaveLength(3);
  });

  it("can be released and subscribed again", () => {
    const ds = new FakeDataSource();
    const cs = createChartSeries(ds);
    cs.subscribe();
    cs.release();
    cs.subscribe();
    expect(ds.subscribe).toHaveBeenCalledTimes(1);
    expect(ds.resume).toHaveBeenCalledTimes(1);
    expect(ds.status).toBe("subscribed");
  });

  it("ignores data received after release", () => {
    const ds = new FakeDataSource();
    ds.subscribe({ range: Range(0, 20) }, () => undefined);
    ds.suspend();
    const cs = createChartSeries(ds);
    cs.subscribe();
    const update = vi.fn();
    cs.on("update", update);
    cs.release();
    ds.sendRows();
    expect(update).not.toHaveBeenCalled();
  });
});
