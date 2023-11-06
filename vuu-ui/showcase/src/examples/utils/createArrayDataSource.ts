import { TickingArrayDataSource } from "./TickingArrayDataSource";
import { getColumnAndRowGenerator, populateArray } from "@finos/vuu-data-test";
import { VuuTable } from "@finos/vuu-protocol-types";

export const createArrayDataSource = ({
  count = 1000,
  table,
}: {
  count?: number;
  table: VuuTable;
}) => {
  const [columnGenerator, rowGenerator, createUpdateGenerator] =
    getColumnAndRowGenerator(table);

  const columns = columnGenerator([]);

  const dataArray = populateArray(count, columnGenerator, rowGenerator);

  return new TickingArrayDataSource({
    columnDescriptors: columns,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore yes we know an ArrayProxy is not a real Array, but don't tell the DataSource that
    data: dataArray,
    updateGenerator: createUpdateGenerator?.(),
  });
};
