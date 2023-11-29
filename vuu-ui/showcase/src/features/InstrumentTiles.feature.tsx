import { vuuModule } from "@finos/vuu-data-test";
import { useViewContext } from "@finos/vuu-layout";
import VuuInstrumentTilesFeature, {
  InstrumentTilesFeatureProps,
} from "feature-vuu-instrument-tiles";

export const InstrumentTilesFeature = ({
  instrumentPricesSchema,
}: InstrumentTilesFeatureProps) => {
  const { saveSession } = useViewContext();
  const dataSource = vuuModule("SIMUL").createDataSource(
    instrumentPricesSchema.table.table
  );

  saveSession?.(dataSource, "data-source");

  return (
    <VuuInstrumentTilesFeature
      instrumentPricesSchema={instrumentPricesSchema}
    />
  );
};
export default InstrumentTilesFeature;
