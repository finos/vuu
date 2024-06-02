import { FeatureConfig, FeatureProps } from "@finos/vuu-shell";
import { TableSchema } from "@finos/vuu-data-types";

export type PathMap = { [key: string]: Pick<FeatureConfig, "css" | "url"> };
export type Environment = "development" | "production";
export const env = process.env.NODE_ENV as Environment;

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

// Sort TableScheas by module
const byModule = (schema1: TableSchema, schema2: TableSchema) => {
  const m1 = schema1.table.module.toLowerCase();
  const m2 = schema2.table.module.toLowerCase();
  if (m1 < m2) {
    return -1;
  } else if (m1 > m2) {
    return 1;
  } else if (schema1.table.table < schema2.table.table) {
    return -1;
  } else if (schema1.table.table > schema2.table.table) {
    return 1;
  } else {
    return 0;
  }
};

export type GetFeaturePaths = (params: {
  env: Environment;
  fileName: string;
  withCss?: boolean;
}) => FeatureProps;

export const getFilterTableFeatures = (
  schemas: TableSchema[],
  getFeaturePath: GetFeaturePaths
): FeatureProps<FilterTableFeatureProps>[] =>
  schemas.sort(byModule).map((schema) => ({
    ComponentProps: {
      tableSchema: schema,
    },
    title: `${schema.table.module} ${schema.table.table}`,
    ...getFeaturePath({ env, fileName: "FilterTable" }),
  }));
