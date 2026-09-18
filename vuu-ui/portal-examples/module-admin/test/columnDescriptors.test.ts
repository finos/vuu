import { MODULE_ADMIN_TABLE_SCHEMAS } from "@vuu-ui/vuu-data-test";
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
});
