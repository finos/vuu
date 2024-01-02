import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { random } from "../../data-utils";
import { buildDataColumnMap, Table } from "../../Table";
import { schemas } from "../simul-schemas";
import { instrumentsData } from "./instruments";

const instrumentsExtendedData = instrumentsData.map((row) =>
  (row as VuuRowDataItemType[])
    .slice(0, -1)
    .concat([random(0, 1) === 1, random(0, 1) === 1, new Date().getTime()])
);

const instrumentsExtendedTable = new Table(
  schemas.instrumentsExtended,
  instrumentsExtendedData,
  buildDataColumnMap(schemas.instrumentsExtended)
);

export default instrumentsExtendedTable;
