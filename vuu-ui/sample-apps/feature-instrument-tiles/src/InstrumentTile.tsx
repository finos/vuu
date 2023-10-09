import { DataSourceRow } from "@finos/vuu-data-types";
import { PriceTicker } from "@finos/vuu-ui-controls";
import { ColumnMap, numericFormatter } from "@finos/vuu-utils";
import { HTMLAttributes, memo } from "react";

import "./InstrumentTile.css";

const classBase = "vuuInstrumentTile";

export interface InstrumentTileProps extends HTMLAttributes<HTMLDivElement> {
  columnMap: ColumnMap;
  instrument: DataSourceRow;
}

const formatNumber = numericFormatter({
  type: {
    name: "number",
    formatting: {
      decimals: 4,
    },
  },
});

export const InstrumentTile = memo(
  ({ columnMap, instrument }: InstrumentTileProps) => {
    const { ask, description, bid } = columnMap;
    return (
      <div className={classBase}>
        <div className={`${classBase}-name`}>{instrument[description]}</div>
        <div className={`${classBase}-value`}>
          {formatNumber(instrument[ask])}
        </div>
        <PriceTicker price={instrument[bid] as number} />
      </div>
    );
  }
);
InstrumentTile.displayName = "InstrumentTile";
