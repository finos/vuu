import VuuFilterTableFeature, {
  FilterTableFeatureProps,
} from "feature-vuu-filter-table";
import { useViewContext } from "@finos/vuu-layout";
import { useTableConfig } from "../examples/utils";

export const FilterTableFeature = ({
  tableSchema,
}: FilterTableFeatureProps) => {
  const { saveSession } = useViewContext();
  const { dataSource } = useTableConfig({
    count: 1000,
    dataSourceConfig: {
      columns: tableSchema.columns.map((col) => col.name),
    },
    table: tableSchema.table,
    rangeChangeRowset: "delta",
  });

  saveSession?.(dataSource, "data-source");

  return <VuuFilterTableFeature tableSchema={tableSchema} />;
};

export default FilterTableFeature;
