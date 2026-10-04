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

/**
 * A Vuu table can be identified either by a full VuuTable (module + table)
 * or simply by table name.
 */
export type VuuTableSpecifier = VuuTable | string;

export interface DynamicFeatureProps<P extends object | undefined = object> {
  /**
    props that will be passed to the lazily loaded component.
   */
  ComponentProps?: P;
  ViewProps?: ViewConfig;
  css?: string;
  height?: number;
  /**
   * Name of icon to display alongside feature in palette. If not
   * specified, a default icon will be used.
   */
  icon?: string;
  title?: string;
  /** 
   The url of javascript bundle to lazily load. Bundle must provide a default export
   and that export must be a React component.
   */
  url: string;
  width?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const vuuConfig: Promise<VuuConfig>;
}

export interface DynamicFeatureDescriptor {
  /**
   * url for css file for feature
   */
  css?: string;
  featureProps?: {
    vuuTables?: "*" | VuuTableSpecifier[];
  };
  /**
   * Name of icon to display alongside feature in palette.
   */
  icon?: string;
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
  vuuTables?: "*" | VuuTableSpecifier[],
): vuuTables is "*" => vuuTables === "*";
export const isVuuTables = (
  vuuTables?: "*" | VuuTableSpecifier[],
): vuuTables is VuuTableSpecifier[] => Array.isArray(vuuTables);

export interface FeaturePropsWithFilterTableFeature extends Omit<
  DynamicFeatureProps,
  "ComponentProps"
> {
  ComponentProps: FilterTableFeatureProps;
}

export const hasFilterTableFeatureProps = (
  props: DynamicFeatureProps,
): props is FeaturePropsWithFilterTableFeature =>
  typeof props.ComponentProps === "object" &&
  props.ComponentProps !== null &&
  "tableSchema" in props.ComponentProps;

export const isSameTable = (t1: VuuTable, t2: VuuTable) =>
  t1.module === t2.module && t1.table == t2.table;

/**
 * Match a VuuTable against a specifier. A string specifier
 * matches on table name only, regardless of module.
 */
export const matchesVuuTable = (
  vuuTableSpecifier: VuuTableSpecifier,
  vuuTable: VuuTable,
) =>
  typeof vuuTableSpecifier === "string"
    ? vuuTableSpecifier === vuuTable.table
    : isSameTable(vuuTableSpecifier, vuuTable);

const getTableName = (vuuTableSpecifier: VuuTableSpecifier) =>
  typeof vuuTableSpecifier === "string"
    ? vuuTableSpecifier
    : vuuTableSpecifier.table;

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

  // Wildcard features (e.g FilterTable) are processed first, so they are listed
  // ahead of table-specific features for the same table.
  const [wildcardTableFeaturesConfig, specificTableFeaturesConfig] = partition(
    tableFeaturesConfig,
    ({ featureProps }) => isWildcardSchema(featureProps?.vuuTables),
  );

  for (const {
    featureProps = {},
    viewProps,
    ...feature
  } of wildcardTableFeaturesConfig.concat(specificTableFeaturesConfig)) {
    const { vuuTables } = featureProps;
    if (
      tableSchemas &&
      (isWildcardSchema(vuuTables) || isVuuTables(vuuTables))
    ) {
      const isWildcard = isWildcardSchema(vuuTables);
      for (const tableSchema of tableSchemas) {
        if (
          isWildcard ||
          vuuTables.some((vuuTable) =>
            matchesVuuTable(vuuTable, tableSchema.table),
          )
        ) {
          const tableTitle = `${tableSchema.table.module} ${wordify(
            tableSchema.table.table,
          )}`;
          tableFeatures.push({
            ...feature,
            ComponentProps: {
              tableSchema,
            },
            // table-specific features are qualified by feature title, to
            // distinguish them from the generic (wildcard) feature
            title: isWildcard
              ? tableTitle
              : `${tableTitle.trim()} (${feature.title})`,
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
              map[`${getTableName(vuuTable)}Schema`] = tableSchemas.find(
                (tableSchema) => matchesVuuTable(vuuTable, tableSchema.table),
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
