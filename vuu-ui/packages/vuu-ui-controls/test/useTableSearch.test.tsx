import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { useTableSearch } from "../src/table-search/useTableSearch";

type TableSearch = ReturnType<typeof useTableSearch>;

const Probe = ({
  baseFilter,
  dataSource,
  onSearch,
}: {
  baseFilter: string;
  dataSource: DataSource;
  onSearch: (search: TableSearch) => void;
}) => {
  onSearch(
    useTableSearch({
      baseFilter,
      dataSource,
      searchColumns: ["description", "ric"],
    }),
  );
  return null;
};

describe("useTableSearch", () => {
  it("preserves exclusions when searching, clearing text and changing basket membership", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const dataSource = { filter: { filter: "" } } as DataSource;
    let search: TableSearch;
    const captureSearch = (value: TableSearch) => {
      search = value;
    };
    const root = createRoot(document.createElement("div"));
    try {
      await act(async () =>
        root.render(
          <Probe
            dataSource={dataSource}
            onSearch={captureSearch}
            baseFilter='ric != "AAPL"'
          />,
        ),
      );
      expect(dataSource.filter?.filter).toBe('(ric != "AAPL")');
      await act(async () => {
        search.onChange({
          target: { value: "Micro" },
        } as unknown as Parameters<typeof search.onChange>[0]);
      });
      expect(dataSource.filter?.filter).toBe(
        '(ric != "AAPL") and (description contains "Micro" or ric contains "Micro")',
      );
      await act(async () =>
        root.render(
          <Probe
            dataSource={dataSource}
            onSearch={captureSearch}
            baseFilter='ric != "AAPL" and ric != "MSFT"'
          />,
        ),
      );
      expect(dataSource.filter?.filter).toBe(
        '(ric != "AAPL" and ric != "MSFT") and (description contains "Micro" or ric contains "Micro")',
      );
      await act(async () => {
        search.onChange({
          target: { value: "" },
        } as unknown as Parameters<typeof search.onChange>[0]);
      });
      expect(dataSource.filter?.filter).toBe(
        '(ric != "AAPL" and ric != "MSFT") and (description contains "" or ric contains "")',
      );
    } finally {
      act(() => root.unmount());
    }
  });
});
