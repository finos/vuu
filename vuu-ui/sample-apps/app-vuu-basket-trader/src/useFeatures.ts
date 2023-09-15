import { useVuuTables } from "@finos/vuu-data-react";
import { FeatureProps, Features } from "@finos/vuu-shell";
import { wordify } from "@finos/vuu-utils";
import { useMemo } from "react";

export interface FeaturesHookProps {
  features: Features;
}

export const useFeatures = ({
  features: featuresProp,
}: FeaturesHookProps): FeatureProps[] => {
  const tables = useVuuTables();
  const features = useMemo<FeatureProps[]>(() => {
    const features: FeatureProps[] = [];
    for (const { featureProps, ...feature } of Object.values(featuresProp)) {
      if (featureProps?.schema && tables) {
        for (const tableSchema of tables.values()) {
          features.push({
            ...feature,
            ComponentProps: {
              tableSchema,
            },
            title: `${tableSchema.table.module} ${wordify(
              tableSchema.table.table
            )}`,
          });
        }
      } else {
        features.push(feature);
      }
    }
    return features;
  }, [featuresProp, tables]);

  return features;
};
