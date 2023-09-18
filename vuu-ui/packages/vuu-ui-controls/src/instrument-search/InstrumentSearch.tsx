import { registerComponent } from "@finos/vuu-layout";

import "./InstrumentSearch.css";

const classBase = "vuuInstrumentSearch";

export const InstrumentSearch = () => {
  return <div className={classBase} />;
};

registerComponent("InstrumentSearch", InstrumentSearch, "view");
