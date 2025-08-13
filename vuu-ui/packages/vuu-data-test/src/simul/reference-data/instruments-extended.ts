import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { random } from "../../data-utils";
import { buildDataColumnMap } from "../../Table";
import { schemas } from "../simul-schemas";
import { instrumentsData } from "./instruments";
import tableContainer from "../../core/table/TableContainer";

const instrumentsExtendedData = instrumentsData.map((row) =>
  (row as VuuRowDataItemType[])
    .slice(0, -1)
    .concat([random(0, 1) === 1, random(0, 1) === 1, new Date().getTime()]),
);

export const instrumentsExtendedTable = tableContainer.createTable(
  schemas.instrumentsExtended,
  instrumentsExtendedData,
  buildDataColumnMap(schemas, "instrumentsExtended"),
);
