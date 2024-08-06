import { useVuuTables } from "@finos/vuu-data-react";
import {
  FeatureProps,
  Features,
  FilterTableFeatureProps,
  getCustomAndTableFeatures,
} from "@finos/vuu-utils";
import { useMemo } from "react";

export interface FeaturesHookProps {
  features: Features;
}

const NO_FEATURES: ReturnType<typeof useVuuFeatures> = [[], []];

export const useVuuFeatures = ({
  features,
}: FeaturesHookProps): [
  FeatureProps[],
  FeatureProps<FilterTableFeatureProps>[]
] => {
  const tables = useVuuTables();
  const [customFeatures, tableFeatures] = useMemo<
    [FeatureProps[], FeatureProps<FilterTableFeatureProps>[]]
  >(
    () => (tables ? getCustomAndTableFeatures(features, tables) : NO_FEATURES),
    [features, tables]
  );
  return [customFeatures, tableFeatures];
};
