import { LayoutProvider, View } from "@vuu-ui/vuu-layout";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import VuuInstrumentTilesFeature from "feature-vuu-instrument-tiles";

export const DefaultInstrumentTilesFeature = () => {
  return (
    <LayoutProvider>
      <View
        Header={VuuBlotterHeader}
        id="instrument-tiles-feature"
        className="vuuTableFeature"
        closeable
        header
        title="Instruments"
        style={{ width: 700, height: 500 }}
      >
        <VuuInstrumentTilesFeature />
      </View>
    </LayoutProvider>
  );
};


