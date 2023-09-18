import { HTMLAttributes } from "react";

import "./InstrumentTileContainer.css";

const classBase = "vuuInstrumentTileContainer";

export interface InstrumentTileContainerProps
  extends HTMLAttributes<HTMLDivElement> {
  name?: string;
}

export const InstrumentTileContainer = ({
  children,
}: InstrumentTileContainerProps) => {
  return <div className={classBase}>{children}</div>;
};
