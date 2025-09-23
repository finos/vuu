import { useViewContext } from "@vuu-ui/vuu-layout";
import { useData } from "@vuu-ui/vuu-utils";
import VuuInstrumentTilesFeature, {
  InstrumentTilesFeatureProps,
} from "feature-vuu-instrument-tiles";

export const InstrumentTilesFeature = ({
  instrumentPricesSchema,
}: InstrumentTilesFeatureProps) => {
  const { VuuDataSource } = useData();
  const { saveSession } = useViewContext();
  const dataSource = new VuuDataSource({
    table: instrumentPricesSchema.table,
  });

  saveSession?.(dataSource, "data-source");

  return (
    <VuuInstrumentTilesFeature
      instrumentPricesSchema={instrumentPricesSchema}
    />
  );
};
export default InstrumentTilesFeature;
