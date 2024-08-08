import { useVuuTables } from "@finos/vuu-data-react";
import {
  DynamicFeatures,
  FeatureProps,
  FilterTableFeatureProps,
  StaticFeatureDescriptor,
  getCustomAndTableFeatures,
} from "@finos/vuu-utils";
import { useMemo } from "react";

export interface FeaturesHookProps {
  features: DynamicFeatures;
  staticFeatures?: StaticFeatureDescriptor[];
}

const NO_FEATURES: ReturnType<typeof useVuuFeatures> = [[], [], []];

export const useVuuFeatures = ({
  features,
  staticFeatures,
}: FeaturesHookProps): [
  FeatureProps[],
  FeatureProps<FilterTableFeatureProps>[],
  StaticFeatureDescriptor[] | undefined
] => {
  const tables = useVuuTables();
  const [customFeatures, tableFeatures, staticCustomFeatures] = useMemo<
    [
      FeatureProps[],
      FeatureProps<FilterTableFeatureProps>[],
      StaticFeatureDescriptor[] | undefined
    ]
  >(
    () =>
      tables
        ? getCustomAndTableFeatures(features, tables, staticFeatures)
        : NO_FEATURES,
    [features, staticFeatures, tables]
  );

  return [customFeatures, tableFeatures, staticCustomFeatures];
};
