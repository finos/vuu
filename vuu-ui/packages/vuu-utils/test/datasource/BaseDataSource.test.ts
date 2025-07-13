import type { DataSourceConstructorProps } from "@vuu-ui/vuu-data-types";
import {
  VuuColumns,
  VuuFilter,
  VuuRange,
  VuuSort,
} from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it, vi } from "vitest";
import { BaseDataSource } from "../../src/datasource/BaseDataSource";
import { vanillaConfig } from "../../src/datasource/datasource-utils";
import { NULL_RANGE, Range } from "../../src/range-utils";

class TestDataSource extends BaseDataSource {
  #setRange?: (range: VuuRange) => void;
  constructor(
    props: Omit<DataSourceConstructorProps, "table">,
    setRange?: (range: VuuRange) => void,
  ) {
    super(props);
    this.#setRange = setRange;
  }

  confirmPendingChanges() {
    this.confirmConfigChange();
  }
  rangeRequest(range: VuuRange): void {
    this, this.#setRange?.(range);
  }
}

describe("BaseDataSource", () => {
  const columns: VuuColumns = ["test1", "test2", "test3"];
  const filterSpec: VuuFilter = { filter: 'test1 = "test"' };
  const range = Range(0, 10);
  const sort: VuuSort = { sortDefs: [{ column: "test1", sortType: "A" }] };
  const runtimeConfigAdditions = {
    baseFilterSpec: { filter: "" },
    visualLink: undefined,
  };
  const CONFIRMED = true;
  const UNCONFIRMED = false;

  const NO_CONFIG_CHANGES = {
    aggregationsChanged: false,
    baseFilterChanged: false,
    columnsChanged: false,
    filterChanged: false,
    groupByChanged: false,
    sortChanged: false,
    visualLinkChanged: false,
  };

  describe("constructor", () => {
    it("Given no config, config is correctly defaulted", () => {
      const ds = new TestDataSource({});
      expect(ds.config).toEqual(vanillaConfig);
    });
    it("Given column only config, config is correctly initialized", () => {
      const ds = new TestDataSource({ columns });
      expect(ds.config).toEqual({
        ...vanillaConfig,
        columns,
      });
    });
    it("Given sort only config, config is correctly initialized", () => {
      const ds = new TestDataSource({ sort });
      expect(ds.config).toEqual({
        ...vanillaConfig,
        sort,
      });
    });
    it("Given filter only config, config is correctly initialized", () => {
      const ds = new TestDataSource({ filterSpec });
      expect(ds.config).toEqual({
        ...vanillaConfig,
        filterSpec,
      });
    });
    it("Given filter and sort config, config is correctly initialized", () => {
      const ds = new TestDataSource({ filterSpec, sort });
      expect(ds.config).toEqual({
        ...vanillaConfig,
        filterSpec,
        sort,
      });
    });
    it("Given full config, config is correctly initialized", () => {
      const ds = new TestDataSource({ columns, filterSpec, sort });
      expect(ds.config).toEqual({
        ...vanillaConfig,
        columns,
        filterSpec,
        sort,
      });
    });
  });

  describe("subscribe", () => {
    it("when called with no config, and created with no config, corerctly defaulted config is used", () => {
      const dataSourceSubscribeCallback = vi.fn();
      const ds = new TestDataSource({});
      ds.subscribe({}, dataSourceSubscribeCallback);
      expect(ds.config).toEqual(vanillaConfig);
    });
    it("when called with sort config, and created with no config, correctly updated config is used", () => {
      const dataSourceSubscribeCallback = vi.fn();
      const ds = new TestDataSource({});
      ds.subscribe({ sort }, dataSourceSubscribeCallback);
      expect(ds.config).toEqual({
        ...vanillaConfig,
        sort,
      });
    });
    it("when called with sort config, and created with filter config, correctly updated config is used", () => {
      const dataSourceSubscribeCallback = vi.fn();
      const ds = new TestDataSource({ filterSpec });
      ds.subscribe({ sort }, dataSourceSubscribeCallback);
      expect(ds.config).toEqual({
        ...vanillaConfig,
        filterSpec,
        sort,
      });
    });
    it("when called with range config, and created with no config, correctly updated config is used", () => {
      const dataSourceSubscribeCallback = vi.fn();
      const ds = new TestDataSource({});
      ds.subscribe({ range }, dataSourceSubscribeCallback);
      expect(ds.config).toEqual(vanillaConfig);
      expect(ds.range.equals(range)).toEqual(true);
    });
  });

  describe("range", () => {
    it("when range is set, value is correctly updated, rangeRequest is invoked and event is emitted", () => {
      vi.useFakeTimers();
      const rangeRequest = vi.fn();
      const dataSourceSubscribeCallback = vi.fn();
      const rangeChangeCallback = vi.fn();
      const ds = new TestDataSource({}, rangeRequest);
      ds.on("range", rangeChangeCallback);
      ds.subscribe({}, dataSourceSubscribeCallback);
      expect(ds.range.equals(NULL_RANGE)).toEqual(true);
      ds.range = range;
      expect(ds.range.equals(range)).toEqual(true);
      expect(rangeRequest).toHaveBeenCalledWith(range);
      vi.advanceTimersToNextFrame();
      expect(rangeChangeCallback).toHaveBeenCalledWith(range);
    });
  });

  describe("async config changes", () => {
    it("when pending sort is set,  event is emitted", () => {
      const rangeRequest = vi.fn();
      const dataSourceSubscribeCallback = vi.fn();
      const configChangeCallback = vi.fn();
      const ds = new TestDataSource({}, rangeRequest);
      ds.on("config", configChangeCallback);
      ds.subscribe({}, dataSourceSubscribeCallback);
      ds.impendingConfig = {
        ...vanillaConfig,
        sort,
      };
      expect(ds.isAwaitingConfirmationOfConfigChange).toEqual(true);
      expect(ds.impendingConfig).toEqual({
        ...vanillaConfig,
        ...runtimeConfigAdditions,
        sort,
      });
      expect(ds.config).toEqual(ds.impendingConfig);
      expect(configChangeCallback).toHaveBeenCalledWith(
        {
          ...vanillaConfig,
          ...runtimeConfigAdditions,
          sort,
        },
        Range(0, 0),
        UNCONFIRMED,
        {
          ...NO_CONFIG_CHANGES,
          sortChanged: true,
        },
      );
      ds.confirmPendingChanges();
      expect(ds.isAwaitingConfirmationOfConfigChange).toEqual(false);
      expect(ds.impendingConfig).toBeUndefined();
      expect(ds.config).toEqual({
        ...vanillaConfig,
        ...runtimeConfigAdditions,
        sort,
      });
      expect(configChangeCallback).toHaveBeenCalledWith(
        {
          ...vanillaConfig,
          ...runtimeConfigAdditions,
          sort,
        },
        Range(0, 0),
        CONFIRMED,
      );
    });
  });
});
