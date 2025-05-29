import { vuuModule } from "@vuu-ui/vuu-data-test";
import { useViewContext } from "@vuu-ui/vuu-layout";
import VuuInstrumentTilesFeature, {
  InstrumentTilesFeatureProps,
} from "feature-vuu-instrument-tiles";

export const InstrumentTilesFeature = ({
  instrumentPricesSchema,
}: InstrumentTilesFeatureProps) => {
  const { saveSession } = useViewContext();
  const dataSource = vuuModule("SIMUL").createDataSource(
    instrumentPricesSchema.table.table,
  );

  saveSession?.(dataSource, "data-source");

  return (
    <VuuInstrumentTilesFeature
      instrumentPricesSchema={instrumentPricesSchema}
    />
  );
};
export default InstrumentTilesFeature;
