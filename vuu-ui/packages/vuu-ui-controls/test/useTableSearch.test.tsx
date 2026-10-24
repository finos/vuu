import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { useTableSearch } from "../src/table-search/useTableSearch";

describe("useTableSearch", () => {
  it("preserves exclusions when searching, clearing text and changing basket membership", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const dataSource = { filter: { filter: "" } } as DataSource;
    let search: ReturnType<typeof useTableSearch>;
    const Probe = ({ baseFilter }: { baseFilter: string }) => {
      search = useTableSearch({
        baseFilter,
        dataSource,
        searchColumns: ["description", "ric"],
      });
      return null;
    };
    const root = createRoot(document.createElement("div"));
    try {
      await act(async () => root.render(<Probe baseFilter='ric != "AAPL"' />));
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
        root.render(<Probe baseFilter='ric != "AAPL" and ric != "MSFT"' />),
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
