import VuuInstrumentTilesFeature, {
  InstrumentTilesFeatureProps,
} from "feature-vuu-instrument-tiles";
import { useViewContext } from "@finos/vuu-layout";
import { useTableConfig } from "../examples/utils";

export const InstrumentTilesFeature = ({
  tableSchema,
}: InstrumentTilesFeatureProps) => {
  const { id, saveSession } = useViewContext();

  const { dataSource } = useTableConfig({
    count: 1000,
    table: tableSchema.table,
    rangeChangeRowset: "delta",
  });

  console.log("save session");
  saveSession?.(dataSource, "data-source");

  return <VuuInstrumentTilesFeature tableSchema={tableSchema} />;
};

export default InstrumentTilesFeature;
