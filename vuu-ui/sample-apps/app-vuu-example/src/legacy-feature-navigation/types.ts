import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";

export interface ViewConfig {
  allowRename?: boolean;
  closeable?: boolean;
  header?: boolean;
}

export interface DynamicFeatureProps<P extends object | undefined = object> {
  ComponentProps?: P;
  ViewProps?: ViewConfig;
  css?: string;
  height?: number;
  title?: string;
  url: string;
  width?: number;
}

export interface DynamicFeatureDescriptor {
  css?: string;
  featureProps?: {
    vuuTables?: "*" | VuuTable[];
  };
  leftNavLocation?: "vuu-features" | "vuu-tables";
  name: string;
  title: string;
  url: string;
  viewProps?: ViewConfig;
}

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

export const isStaticFeatures = (
  features: unknown,
): features is { label: string; type: string }[] =>
  Array.isArray(features) &&
  features.every(
    (feature) =>
      feature !== null &&
      typeof feature === "object" &&
      "type" in feature &&
      "label" in feature,
  );

const isCustomFeature = (feature: DynamicFeatureDescriptor) =>
  feature.leftNavLocation === "vuu-features";

const isWildcardSchema = (vuuTables?: "*" | VuuTable[]): vuuTables is "*" =>
  vuuTables === "*";

const isVuuTables = (vuuTables?: "*" | VuuTable[]): vuuTables is VuuTable[] =>
  Array.isArray(vuuTables);

const isSameTable = (first: VuuTable, second: VuuTable) =>
  first.module === second.module && first.table === second.table;

export const hasFilterTableFeatureProps = (
  props: DynamicFeatureProps,
): props is DynamicFeatureProps<FilterTableFeatureProps> =>
  typeof props.ComponentProps === "object" &&
  props.ComponentProps !== null &&
  "tableSchema" in props.ComponentProps;

export const getCustomAndTableFeatures = (
  featureDescriptors: DynamicFeatureDescriptor[],
  tableSchemas: TableSchema[],
) => {
  const customFeatures: DynamicFeatureProps[] = [];
  const tableFeatures: DynamicFeatureProps<FilterTableFeatureProps>[] = [];

  for (const descriptor of featureDescriptors) {
    const { featureProps = {}, viewProps, ...feature } = descriptor;
    const { vuuTables } = featureProps;

    if (!isCustomFeature(descriptor)) {
      if (isWildcardSchema(vuuTables)) {
        for (const tableSchema of tableSchemas) {
          tableFeatures.push({
            ...feature,
            ComponentProps: { tableSchema },
            title: `${tableSchema.table.module} ${tableSchema.table.table}`,
            ViewProps: {
              ...viewProps,
              allowRename: true,
            },
          });
        }
      }
      continue;
    }

    if (isVuuTables(vuuTables)) {
      customFeatures.push({
        ...feature,
        ComponentProps: vuuTables.reduce<Record<string, TableSchema>>(
          (tableMap, vuuTable) => {
            tableMap[`${vuuTable.table}Schema`] = tableSchemas.find(
              (tableSchema) => isSameTable(vuuTable, tableSchema.table),
            ) as TableSchema;
            return tableMap;
          },
          {},
        ),
        ViewProps: viewProps,
      });
    } else {
      customFeatures.push(feature);
    }
  }

  return { dynamicFeatures: customFeatures, tableFeatures };
};
