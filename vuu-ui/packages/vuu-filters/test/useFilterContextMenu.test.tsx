import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type { DateTimePattern } from "@vuu-ui/vuu-utils";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useFilterContextMenu } from "../src/filter-context-menu/useFilterContextMenu";
import { useSavedFilters } from "../src/filter-provider/FilterContext";
import { FilterProvider } from "../src/filter-provider/FilterProvider";

// creates a Worker on import, not needed here
vi.mock("@vuu-ui/vuu-data-remote", () => ({}));

const execTime: ColumnDescriptor = {
  name: "execTime",
  serverDataType: "epochtimestampnano",
  type: {
    name: "date/time",
    formatting: {
      pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" },
      timeZone: "UTC",
    },
  },
};

// 2026-09-29 23:00:00.123456789 UTC
const dataRow = { execTime: "1790722800123456789" };
const options = { column: execTime, dataRow } as never;

let contextMenu: ReturnType<typeof useFilterContextMenu>;
let savedFilters: ReturnType<typeof useSavedFilters>;

const Fixture = () => {
  contextMenu = useFilterContextMenu();
  savedFilters = useSavedFilters();
  return null;
};

const setFilterLabel = () => {
  const [setFilter] = contextMenu.menuBuilder("grid", options) as {
    label: string;
  }[];
  return setFilter.label;
};

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = false;
});

describe("useFilterContextMenu, temporal cell", () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (columnFilterPatterns?: Record<string, DateTimePattern>) =>
    act(() =>
      root.render(
        <FilterProvider columnFilterPatterns={columnFilterPatterns}>
          <Fixture />
        </FilterProvider>,
      ),
    );

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("WHEN no ColumnFilter is configured THEN filters at Table precision", () => {
    render();
    expect(setFilterLabel()).toEqual(
      "Set filter execTime '2026-09-29 23:00:00.123456789'",
    );
  });

  it("WHEN FilterProvider columnFilterPatterns configures the (unmounted) ColumnFilter THEN filters at ColumnFilter precision", () => {
    render({ execTime: { time: "hh:mm:ss" } });
    expect(setFilterLabel()).toEqual("Set filter execTime '23:00:00'");
    act(() => contextMenu.menuActionHandler("filter-set", options));
    expect(savedFilters.currentFilter.filter).toMatchObject({
      column: "execTime",
      op: "=",
      value: "23:00:00",
    });
  });

  it("WHEN the configured ColumnFilter pattern has milliseconds THEN filters the whole millisecond", () => {
    render({ execTime: { time: "hh:mm:ss.ms" } });
    expect(setFilterLabel()).toEqual("Set filter execTime '23:00:00.123'");
  });

  it("WHEN the configured ColumnFilter pattern is a date THEN filters the whole day", () => {
    render({ execTime: { date: "yyyy-mm-dd" } });
    expect(setFilterLabel()).toEqual("Set filter execTime '2026-09-29'");
  });
});
