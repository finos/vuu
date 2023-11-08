import VuuFilterTableFeature, {
  FilterTableFeatureProps,
} from "feature-vuu-filter-table";
import { vuuModule, VuuModuleName } from "@finos/vuu-data-test";
import { useViewContext } from "@finos/vuu-layout";
import { useMemo } from "react";

export const FilterTableFeature = ({
  tableSchema,
}: FilterTableFeatureProps) => {
  const { saveSession } = useViewContext();
  const {
    table: { module, table: tableName },
  } = tableSchema;

  const dataSource = useMemo(
    () => vuuModule(module as VuuModuleName).createDataSource(tableName),
    [module, tableName]
  );

  saveSession?.(dataSource, "data-source");

  return <VuuFilterTableFeature tableSchema={tableSchema} />;
};

export default FilterTableFeature;
