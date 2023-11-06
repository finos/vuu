import { useVuuTables } from "@finos/vuu-data-react";
import {
  FeatureProps,
  Features,
  isTableSchema,
  isWildcardSchema,
} from "@finos/vuu-shell";
import { wordify } from "@finos/vuu-utils";
import { TableSchema } from "@finos/vuu-data";
import { useMemo } from "react";

export interface FeaturesHookProps {
  features: Features;
}

export const useFeatures = ({
  features: featuresProp,
}: FeaturesHookProps): [FeatureProps[], FeatureProps[]] => {
  const tables = useVuuTables();
  const [features, tableFeatures] = useMemo<
    [FeatureProps[], FeatureProps[]]
  >(() => {
    const features: FeatureProps[] = [];
    const tableFeatures: FeatureProps[] = [];
    for (const {
      featureProps = {},
      leftNavLocation = "vuu-tables",
      ...feature
    } of Object.values(featuresProp)) {
      const { schema, schemas } = featureProps;
      const target =
        leftNavLocation === "vuu-tables" ? tableFeatures : features;
      if (isWildcardSchema(schema) && tables) {
        for (const tableSchema of tables.values()) {
          target.push({
            ...feature,
            ComponentProps: {
              tableSchema,
            },
            title: `${tableSchema.table.module} ${wordify(
              tableSchema.table.table
            )}`,
          });
        }
      } else if (isTableSchema(schema) && tables) {
        //TODO set the
        const tableSchema = tables.get(schema.table);
        target.push({
          ...feature,
          ComponentProps: {
            tableSchema,
          },
        });
      } else if (Array.isArray(schemas)) {
        target.push({
          ...feature,
          ComponentProps: schemas.reduce<Record<string, TableSchema>>(
            (map, schema) => {
              map[`${schema.table}Schema`] = tables?.get(
                schema.table
              ) as TableSchema;
              return map;
            },
            {}
          ),
        });
      } else {
        target.push(feature);
      }
    }
    return [features, tableFeatures];
  }, [featuresProp, tables]);

  return [features, tableFeatures];
};
