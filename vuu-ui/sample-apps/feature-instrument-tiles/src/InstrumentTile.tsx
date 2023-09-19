import { DataSourceRow } from "packages/vuu-data-types";
import { ColumnMap } from "packages/vuu-utils/src";
import { HTMLAttributes } from "react";

import "./InstrumentTile.css";

const classBase = "vuuInstrumentTile";

export interface InstrumentTileProps extends HTMLAttributes<HTMLDivElement> {
  columnMap: ColumnMap;
  instrument: DataSourceRow;
}

export const InstrumentTile = ({
  columnMap,
  instrument,
}: InstrumentTileProps) => {
  const { ask, description, bid, ric } = columnMap;
  console.log({ instrument, columnMap });
  return (
    <div className={classBase}>
      <div>{instrument[description]}</div>
      <div>{instrument[ask]}</div>
    </div>
  );
};
