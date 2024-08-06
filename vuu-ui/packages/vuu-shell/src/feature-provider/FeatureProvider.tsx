import {
  FeatureProps,
  Features,
  FilterTableFeatureProps,
} from "@finos/vuu-utils";
import { ReactElement, ReactNode, createContext, useContext } from "react";
import { useVuuFeatures } from "./useVuuFeatures";

export interface FeatureContextProps {
  features: FeatureProps[];
  tableFeatures: FeatureProps<FilterTableFeatureProps>[];
}

const NO_FEATURES: FeatureContextProps["features"] = [];
const NO_TABLES: FeatureContextProps["tableFeatures"] = [];

const FeatureContext = createContext<FeatureContextProps>({
  features: NO_FEATURES,
  tableFeatures: NO_TABLES,
});

export interface FeatureProviderProps extends Partial<FeatureContextProps> {
  children: ReactNode;
  configuredFeatures: Features;
}

export const FeatureProvider = ({
  children,
  configuredFeatures,
  features: featuresProp,
  tableFeatures: tableFeaturesProp,
}: FeatureProviderProps): ReactElement => {
  const [vuuFeatures, vuuTableFeatures] = useVuuFeatures({
    features: configuredFeatures,
  });

  return (
    <FeatureContext.Provider
      value={{
        features: featuresProp ?? vuuFeatures,
        tableFeatures: tableFeaturesProp ?? vuuTableFeatures,
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
      localFeatures.tableFeatures === undefined)
  ) {
    return contextFeatures;
  } else {
    return {
      features: localFeatures.features ?? contextFeatures.features,
      tableFeatures:
        localFeatures.tableFeatures ?? contextFeatures.tableFeatures,
    };
  }
};
