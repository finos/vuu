import { View } from "@finos/vuu-layout";
import { useTableSchema } from "../../utils";
import { useAutoLoginToVuuServer } from "../../utils/useAutoLoginToVuuServer";
import { VuuBlotter } from "./VuuBlotter";
import { VuuBlotterHeader } from "./VuuBlotterHeader";

import "./VuuBlotter.examples.css";

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
