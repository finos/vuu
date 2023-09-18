import { useVuuTables } from "@finos/vuu-data-react";
import { FeatureProps, Features } from "@finos/vuu-shell";
import { wordify } from "@finos/vuu-utils";
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
      featureProps,
      leftNavLocation = "vuu-tables",
      ...feature
    } of Object.values(featuresProp)) {
      const target =
        leftNavLocation === "vuu-tables" ? tableFeatures : features;
      if (featureProps?.schema === "*" && tables) {
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
      } else if (featureProps?.schema && tables) {
        //TODO set the
        const tableSchema = tables.get(featureProps?.schema);
        target.push({
          ...feature,
          ComponentProps: {
            tableSchema,
          },
        });
      } else {
        target.push(feature);
      }
    }
    return [features, tableFeatures];
  }, [featuresProp, tables]);

  return [features, tableFeatures];
};
