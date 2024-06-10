import { useVuuTables } from "@finos/vuu-data-react";
import { FeatureProps } from "@finos/vuu-shell";
import {
  Features,
  FilterTableFeatureProps,
  getCustomAndTableFeatures,
} from "@finos/vuu-utils";
import { useMemo } from "react";

export interface FeaturesHookProps {
  features: Features;
}

const NO_FEATURES: ReturnType<typeof useFeatures> = [[], []];

export const useFeatures = ({
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
