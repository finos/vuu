import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ListOption } from "@vuu-ui/vuu-table-types";
import { partition } from "./array-utils";
import { wordify } from "./text-utils";
import React, { ReactElement } from "react";
import { getLayoutComponent } from "./component-registry";

export type PathMap = {
  [key: string]: Pick<DynamicFeatureDescriptor, "css" | "url">;
};
export type Environment = "development" | "production";
export const env = process.env.NODE_ENV as Environment;

export type LookupTableProvider = (table: VuuTable) => ListOption[];

export interface ViewConfig {
  allowRename?: boolean;
  closeable?: boolean;
  header?: boolean;
}

export interface DynamicFeatureProps<P extends object | undefined = object> {
  /**
    props that will be passed to the lazily loaded component.
   */
  ComponentProps?: P;
  ViewProps?: ViewConfig;
  css?: string;
  height?: number;
  title?: string;
  /** 
   The url of javascript bundle to lazily load. Bundle must provide a default export
   and that export must be a React component.
   */
  url: string;
  width?: number;
}

declare global {
  const vuuConfig: Promise<VuuConfig>;
}

export interface DynamicFeatureDescriptor {
  /**
   * url for css file for feature
   */
  css?: string;
  featureProps?: {
    vuuTables?: "*" | VuuTable[];
  };
  leftNavLocation: "vuu-features" | "vuu-tables";
  name: string;
  title: string;
  /**
   * url for javascript bundle to load feature
   */
  url: string;
  viewProps?: ViewConfig;
}

export interface StaticFeatureDescriptor {
  group?: string;
  label: string;
  type: string;
}

const isStaticFeature = (
  feature: unknown,
): feature is StaticFeatureDescriptor =>
  feature !== null && typeof feature === "object" && "type" in feature;

export const isStaticFeatures = (
  features: unknown,
): features is StaticFeatureDescriptor[] =>
  Array.isArray(features) && features.every(isStaticFeature);

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

export type DynamicFeatures = {
  [key: string]: DynamicFeatureDescriptor;
};

export function featureFromJson({ type }: { type: string }): ReactElement {
  const componentType = type.match(/^[a-z]/) ? type : getLayoutComponent(type);
  if (componentType === undefined) {
    throw Error(
      `layoutUtils unable to create feature component from JSON, unknown type ${type}`,
    );
  }
  return React.createElement(componentType);
}

export interface VuuConfig {
  features: DynamicFeatures;
  authUrl?: string;
  websocketUrl: string;
  ssl: boolean;
}

/**
 * We currently categorize 'features' simply by the leftNavLocation
 * @param feature
 * @returns
 */
export const isCustomFeature = (feature: DynamicFeatureDescriptor) =>
  feature.leftNavLocation === "vuu-features";

export const isWildcardSchema = (
  vuuTables?: "*" | VuuTable[],
): vuuTables is "*" => vuuTables === "*";
export const isVuuTables = (
  vuuTables?: "*" | VuuTable[],
): vuuTables is VuuTable[] => Array.isArray(vuuTables);

export interface FeaturePropsWithFilterTableFeature
  extends Omit<DynamicFeatureProps, "ComponentProps"> {
  ComponentProps: FilterTableFeatureProps;
}

export const hasFilterTableFeatureProps = (
  props: DynamicFeatureProps,
): props is FeaturePropsWithFilterTableFeature =>
  typeof props.ComponentProps === "object" &&
  props.ComponentProps !== null &&
  "tableSchema" in props.ComponentProps;

export const isSameTable = (t1: VuuTable, t2: VuuTable) => {
  t1.module === t2.module && t1.table == t2.table;
};

// Sort TableScheas by module
export const byModule = (schema1: TableSchema, schema2: TableSchema) => {
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
}) => DynamicFeatureProps;

export const getFilterTableFeatures = (
  schemas: TableSchema[],
  getFeaturePath: GetFeaturePaths,
) =>
  schemas
    .sort(byModule)
    .map<DynamicFeatureProps<FilterTableFeatureProps>>((schema) => ({
      ...getFeaturePath({ env, fileName: "FilterTable" }),
      ComponentProps: {
        tableSchema: schema,
      },
      ViewProps: {
        allowRename: true,
      },
      title: `${schema.table.module} ${schema.table.table}`,
    }));

export type Component = {
  componentName: string;
  component: unknown;
};

export const assertComponentRegistered = (
  componentName: string,
  component: unknown,
) => {
  if (typeof component !== "function") {
    console.warn(
      `${componentName} module not loaded, will be unabale to deserialize from layout JSON`,
    );
  }
};

export const assertComponentsRegistered = (componentList: Component[]) => {
  for (const { componentName, component } of componentList) {
    assertComponentRegistered(componentName, component);
  }
};
/**
 *  Process the DynamicFeature descriptors. Identify
 * the vuu tables required and inject the appropriate TableSchemas
 *
 * @param dynamicFeatures
 * @param tableSchemas
 * @returns
 */
export const getCustomAndTableFeatures = (
  dynamicFeatures: DynamicFeatureDescriptor[],
  tableSchemas: TableSchema[],
): {
  dynamicFeatures: DynamicFeatureProps[];
  tableFeatures: DynamicFeatureProps<FilterTableFeatureProps>[];
} => {
  // Split features into simple tables and 'custom' features
  const [customFeatureConfig, tableFeaturesConfig] = partition(
    dynamicFeatures,
    isCustomFeature,
  );

  const customFeatures: DynamicFeatureProps[] = [];
  const tableFeatures: DynamicFeatureProps<FilterTableFeatureProps>[] = [];

  for (const {
    featureProps = {},
    viewProps,
    ...feature
  } of tableFeaturesConfig) {
    const { vuuTables } = featureProps;
    // Currently FilterTable is the only 'tableFeature' and it uses the wildcard
    if (isWildcardSchema(vuuTables)) {
      if (tableSchemas) {
        for (const tableSchema of tableSchemas) {
          tableFeatures.push({
            ...feature,
            ComponentProps: {
              tableSchema,
            },
            title: `${tableSchema.table.module} ${wordify(
              tableSchema.table.table,
            )}`,
            ViewProps: {
              ...viewProps,
              allowRename: true,
            },
          });
        }
      }
    }
  }

  for (const {
    featureProps = {},
    viewProps,
    ...feature
  } of customFeatureConfig) {
    const { vuuTables } = featureProps;
    if (isVuuTables(vuuTables)) {
      if (tableSchemas) {
        customFeatures.push({
          ...feature,
          ComponentProps: vuuTables.reduce<Record<string, TableSchema>>(
            (map, vuuTable) => {
              map[`${vuuTable.table}Schema`] = tableSchemas.find(
                (tableSchema) => isSameTable(vuuTable, tableSchema.table),
              ) as TableSchema;
              return map;
            },
            {},
          ),
          ViewProps: viewProps,
        });
      }
    } else {
      customFeatures.push(feature);
    }
  }
  return { dynamicFeatures: customFeatures, tableFeatures: tableFeatures };
};
