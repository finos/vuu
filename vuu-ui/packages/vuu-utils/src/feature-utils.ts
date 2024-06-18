import type { TableSchema } from "@finos/vuu-data-types";
import type { VuuTable } from "@finos/vuu-protocol-types";
import type { FeatureProps } from "@finos/vuu-shell";
import { partition } from "./array-utils";
import { wordify } from "./text-utils";

export type PathMap = { [key: string]: Pick<FeatureConfig, "css" | "url"> };
export type Environment = "development" | "production";
export const env = process.env.NODE_ENV as Environment;

export interface ViewConfig {
  closeable?: boolean;
  header?: boolean;
}

declare global {
  const vuuConfig: Promise<VuuConfig>;
}

export interface FeatureConfig {
  name: string;
  title: string;
  url: string;
  css?: string;
  leftNavLocation: "vuu-features" | "vuu-tables";
  featureProps?: {
    schema?: "*" | VuuTable;
    schemas?: VuuTable[];
  };
  viewProps?: ViewConfig;
}

export interface VuuConfig {
  features: Features;
  authUrl?: string;
  websocketUrl: string;
  ssl: boolean;
}

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

export type Features = {
  [key: string]: FeatureConfig;
};
export interface VuuConfig {
  features: Features;
  authUrl?: string;
  websocketUrl: string;
  ssl: boolean;
}

export const isCustomFeature = (feature: FeatureConfig) =>
  feature.leftNavLocation === "vuu-features";

export const isWildcardSchema = (schema?: "*" | VuuTable): schema is "*" =>
  schema === "*";
export const isTableSchema = (schema?: "*" | VuuTable): schema is VuuTable =>
  typeof schema === "object" &&
  typeof schema.module === "string" &&
  typeof schema.table === "string";

export interface FeaturePropsWithFilterTableFeature
  extends Omit<FeatureProps, "ComponentProps"> {
  ComponentProps: FilterTableFeatureProps;
}

export const hasFilterTableFeatureProps = (
  props: FeatureProps
): props is FeaturePropsWithFilterTableFeature =>
  "tableSchema" in (props?.ComponentProps ?? {});

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
}) => FeatureProps;

export const getFilterTableFeatures = (
  schemas: TableSchema[],
  getFeaturePath: GetFeaturePaths
) =>
  schemas
    .sort(byModule)
    .map<FeatureProps<FilterTableFeatureProps>>((schema) => ({
      ...getFeaturePath({ env, fileName: "FilterTable" }),
      ComponentProps: {
        tableSchema: schema,
      },
      title: `${schema.table.module} ${schema.table.table}`,
    }));

export const assertComponentRegistered = (
  componentName: string,
  component: unknown
) => {
  if (typeof component !== "function") {
    console.warn(
      `${componentName} module not loaded, will be unabale to deserialize from layout JSON`
    );
  }
};

export const getCustomAndTableFeatures = (
  features: Features,
  vuuTables: Map<string, TableSchema>
): [FeatureProps[], FeatureProps<FilterTableFeatureProps>[]] => {
  const [customFeatureConfig, tableFeaturesConfig] = partition(
    Object.values(features),
    isCustomFeature
  );

  const customFeatures: FeatureProps[] = [];
  const tableFeatures: FeatureProps<FilterTableFeatureProps>[] = [];

  for (const {
    featureProps = {},
    viewProps,
    ...feature
  } of tableFeaturesConfig) {
    const { schema } = featureProps;
    if (isWildcardSchema(schema) && vuuTables) {
      for (const tableSchema of vuuTables.values()) {
        tableFeatures.push({
          ...feature,
          ComponentProps: {
            tableSchema,
          },
          title: `${tableSchema.table.module} ${wordify(
            tableSchema.table.table
          )}`,
          ViewProps: viewProps,
        });
      }
    } else if (isTableSchema(schema) && vuuTables) {
      const tableSchema = vuuTables.get(schema.table);
      if (tableSchema) {
        tableFeatures.push({
          ...feature,
          ComponentProps: {
            tableSchema,
          },
          ViewProps: viewProps,
        });
      }
    }
  }

  for (const {
    featureProps = {},
    viewProps,
    ...feature
  } of customFeatureConfig) {
    const { schema, schemas } = featureProps;
    if (isTableSchema(schema) && vuuTables) {
      const tableSchema = vuuTables.get(schema.table);
      customFeatures.push({
        ...feature,
        ComponentProps: {
          tableSchema,
        },
        ViewProps: viewProps,
      });
    } else if (Array.isArray(schemas) && vuuTables) {
      customFeatures.push({
        ...feature,
        ComponentProps: schemas.reduce<Record<string, TableSchema>>(
          (map, schema) => {
            map[`${schema.table}Schema`] = vuuTables.get(
              schema.table
            ) as TableSchema;
            return map;
          },
          {}
        ),
        ViewProps: viewProps,
      });
    } else {
      customFeatures.push(feature);
    }
  }
  return [customFeatures, tableFeatures];
};
