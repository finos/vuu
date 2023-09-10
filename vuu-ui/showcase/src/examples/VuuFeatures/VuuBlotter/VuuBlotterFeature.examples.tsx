import { View } from "@finos/vuu-layout";
import { useTableSchema } from "../../utils";
import { useAutoLoginToVuuServer } from "../../utils/useAutoLoginToVuuServer";
import { VuuBlotter } from "../../../features/VuuBlotter.feature";
import { VuuBlotterMockData } from "../../../features/VuuBlotterMockData.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";

import "./VuuBlotterFeature.examples.css";
import { Flexbox } from "@finos/vuu-layout";

let displaySequence = 1;

export const DefaultVuuBlotter = () => {
  const error = useAutoLoginToVuuServer();

  const schema = useTableSchema("instruments");

  if (error) {
    return error;
  }
  return (
    <View
      Header={VuuBlotterHeader}
      className="vuuBlotterView"
      closeable
      header
      title="Instruments"
      style={{ width: 700, height: 500 }}
    >
      <VuuBlotter schema={schema} />
    </View>
  );
};
DefaultVuuBlotter.displaySequence = displaySequence++;

export const DefaultVuuBlotterMockData = () => {
  const schema = useTableSchema("instruments");

  return (
    <Flexbox style={{ flexDirection: "column", height: 900 }}>
      <View
        Header={VuuBlotterHeader}
        className="vuuBlotterView"
        closeable
        header
        resizeable
        title="Instruments"
        style={{ width: 700, height: 500 }}
      >
        <VuuBlotterMockData schema={schema} />
      </View>
      <div data-resizeable style={{ background: "red", flex: "1 1 300px" }} />
    </Flexbox>
  );
};
DefaultVuuBlotterMockData.displaySequence = displaySequence++;
