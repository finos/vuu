import { describe, expect, it } from "vitest";
import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import {
  lookupOptionsFromRows,
  type OptionMap,
} from "../src/lookup-values/useLookupValues";

describe("lookupOptionsFromRows", () => {
  const optionMap: OptionMap = {
    label: "client_name",
    value: "client_id",
  };

  it("maps lookup columns from data source rows", () => {
    const rows: DataSourceRow[] = [
      [0, 0, true, false, 0, 0, "row-1", 0, 0, false, "Vuu Portal", "client-1"],
    ];

    expect(
      lookupOptionsFromRows(["client_name", "client_id"], rows, optionMap),
    ).toEqual([{ value: "client-1", label: "Vuu Portal" }]);
  });

  it("includes requested lookup metadata without changing the selected value", () => {
    const rows: DataSourceRow[] = [
      [
        0,
        0,
        true,
        false,
        0,
        0,
        "row-1",
        0,
        0,
        false,
        "Vuu Portal",
        "client-1",
        "vuu-portal",
      ],
    ];

    expect(
      lookupOptionsFromRows(
        ["client_name", "client_id", "client_identifier"],
        rows,
        { ...optionMap, additionalFields: ["client_identifier"] },
      ),
    ).toEqual([
      {
        value: "client-1",
        label: "Vuu Portal",
        metadata: { client_identifier: "vuu-portal" },
      },
    ]);
  });

  it("fails explicitly when a requested lookup column is missing", () => {
    expect(() => lookupOptionsFromRows(["client_name"], [], optionMap)).toThrow(
      "[useLookupValues] lookup columns not found: client_id, client_name",
    );
  });
});
