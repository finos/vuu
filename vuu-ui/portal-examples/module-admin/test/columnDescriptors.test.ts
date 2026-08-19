import { MODULE_ADMIN_TABLE_SCHEMAS } from "@vuu-ui/vuu-data-test";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import { dataRowFactory } from "@vuu-ui/vuu-table";
import { KeySet, vuuRowToDataSourceRow } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import { moduleColumnDescriptors } from "../src/columnDescriptors";

describe("module column descriptors", () => {
  it("preserves the modules schema order while hiding its ID", () => {
    const descriptorNames = moduleColumnDescriptors.map(({ name }) => name);
    const schemaNames = MODULE_ADMIN_TABLE_SCHEMAS.modules.columns.map(
      ({ name }) => name,
    );

    expect(descriptorNames).toEqual(
      schemaNames.slice(0, descriptorNames.length),
    );
    expect(moduleColumnDescriptors[0]).toMatchObject({
      name: "id",
      hidden: true,
    });
  });

  it("maps the modules ID after Vuu's row metadata", () => {
    const [DataRow] = dataRowFactory(
      moduleColumnDescriptors.map(({ name }) => name),
      MODULE_ADMIN_TABLE_SCHEMAS.modules.columns,
    );
    const serverRow = {
      data: [
        1,
        "moduleAdmin",
        "Manage remote modules",
        "Create new remote module, update existing modules",
      ],
      rowIndex: 0,
      rowKey: "1",
      sel: 0,
      ts: 1_710_000_000_000,
      updateType: "U",
      viewPortId: "modules",
      vpSize: 1,
      vpVersion: "",
    } satisfies VuuRow;

    const dataRow = DataRow(
      vuuRowToDataSourceRow(serverRow, new KeySet({ from: 0, to: 1 })),
    );

    expect(dataRow.index).toBe(0);
    expect(dataRow.key).toBe("1");
    expect(dataRow.id).toBe(1);
    expect(dataRow.name).toBe("moduleAdmin");
    expect(dataRow.title).toBe("Manage remote modules");
  });
});
