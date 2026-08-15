import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it, vi } from "vitest";
import { getCellValue } from "../src/table-cell/TableCell";

describe("TableCell", () => {
  it("does not read a client column from the DataRow", () => {
    const dataRow = new Proxy(
      {},
      {
        get: vi.fn(() => {
          throw Error("client column accessed DataRow");
        }),
      },
    ) as DataRow;

    expect(
      getCellValue(
        { name: "arbitrary-client-action", source: "client" },
        dataRow,
      ),
    ).toBeUndefined();
  });

  it("reads a server column from the DataRow", () => {
    const dataRow = { arbitrary_server_value: "value" } as DataRow;

    expect(
      getCellValue(
        { name: "arbitrary_server_value", source: "server" },
        dataRow,
      ),
    ).toBe("value");
  });
});
