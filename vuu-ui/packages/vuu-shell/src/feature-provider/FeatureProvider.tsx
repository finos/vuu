import {
  DynamicFeatures,
  FeatureProps,
  FilterTableFeatureProps,
  StaticFeatureDescriptor,
} from "@finos/vuu-utils";
import { ReactElement, ReactNode, createContext, useContext } from "react";
import { useVuuFeatures } from "./useVuuFeatures";

export interface FeatureContextProps {
  features: FeatureProps[];
  tableFeatures: FeatureProps<FilterTableFeatureProps>[];
  staticFeatures: StaticFeatureDescriptor[] | undefined;
}

const NO_FEATURES: FeatureContextProps["features"] = [];
const NO_TABLES: FeatureContextProps["tableFeatures"] = [];
const NO_STATICFEATURES: FeatureContextProps["staticFeatures"] = [];

const FeatureContext = createContext<FeatureContextProps>({
  features: NO_FEATURES,
  tableFeatures: NO_TABLES,
  staticFeatures: NO_STATICFEATURES,
});

export interface FeatureProviderProps extends Partial<FeatureContextProps> {
  children: ReactNode;
  dynamicFeatures: DynamicFeatures;
  staticFeatures?: StaticFeatureDescriptor[];
}

export const FeatureProvider = ({
  children,
  dynamicFeatures,
  features: featuresProp,
  tableFeatures: tableFeaturesProp,
  staticFeatures,
}: FeatureProviderProps): ReactElement => {
  const [vuuFeatures, vuuTableFeatures, staticVuuFeatures] = useVuuFeatures({
    staticFeatures,
    features: dynamicFeatures,
  });

  return (
    <FeatureContext.Provider
      value={{
        features: featuresProp ?? vuuFeatures,
        tableFeatures: tableFeaturesProp ?? vuuTableFeatures,
        staticFeatures: staticFeatures ?? staticVuuFeatures,
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
};

export type FeaturesHook = (
  props?: Partial<FeatureContextProps>
) => FeatureContextProps;
export const useFeatures: FeaturesHook = (localFeatures) => {
  const contextFeatures = useContext(FeatureContext);
  if (
    localFeatures === undefined ||
    (localFeatures.features === undefined &&
      localFeatures.tableFeatures === undefined &&
      localFeatures.staticFeatures === undefined)
  ) {
    return contextFeatures;
  } else {
    return {
      features: localFeatures.features ?? contextFeatures.features,
      tableFeatures:
        localFeatures.tableFeatures ?? contextFeatures.tableFeatures,
      staticFeatures:
        localFeatures.staticFeatures ?? contextFeatures.staticFeatures,
    };
  }
};
