import {
  DynamicFeatures,
  FeatureProps,
  FilterTableFeatureProps,
  StaticFeatures,
  getCustomAndTableFeatures,
} from "@finos/vuu-utils";
import {
  ReactElement,
  ReactNode,
  createContext,
  useContext,
  useMemo,
} from "react";
import { useVuuTables } from "@finos/vuu-data-react";

export interface FeatureContextProps {
  dynamicFeatures: FeatureProps[];
  tableFeatures: FeatureProps<FilterTableFeatureProps>[];
  staticFeatures?: StaticFeatures;
}

const NO_FEATURES: FeatureContextProps["dynamicFeatures"] = [];
const NO_TABLES: FeatureContextProps["tableFeatures"] = [];
const NO_STATICFEATURES: FeatureContextProps["staticFeatures"] = {};

const NO_FEATURES_VUU: {
  dynamicFeatures: FeatureProps[];
  tableFeatures: FeatureProps<FilterTableFeatureProps>[];
} = { dynamicFeatures: [], tableFeatures: [] };

const FeatureContext = createContext<FeatureContextProps>({
  dynamicFeatures: NO_FEATURES,
  tableFeatures: NO_TABLES,
  staticFeatures: NO_STATICFEATURES,
});

export interface FeatureProviderProps extends Partial<FeatureContextProps> {
  children: ReactNode;
  features: DynamicFeatures;
  staticFeatures?: StaticFeatures;
}

export const FeatureProvider = ({
  children,
  features,
  staticFeatures,
}: FeatureProviderProps): ReactElement => {
  const vuuTables = useVuuTables();
  const { dynamicFeatures, tableFeatures } = useMemo<{
    dynamicFeatures: FeatureProps[];
    tableFeatures: FeatureProps<FilterTableFeatureProps>[];
  }>(
    () =>
      vuuTables
        ? getCustomAndTableFeatures(features, vuuTables)
        : NO_FEATURES_VUU,
    [features, vuuTables]
  );

  return (
    <FeatureContext.Provider
      value={{
        dynamicFeatures,
        tableFeatures,
        staticFeatures,
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
};

export type FeaturesHook = (
  props?: Partial<FeatureContextProps>
) => FeatureContextProps;
export const useFeatures: FeaturesHook = (localFeatures?) => {
  const contextFeatures = useContext(FeatureContext);
  if (
    localFeatures === undefined ||
    (localFeatures.dynamicFeatures === undefined &&
      localFeatures.tableFeatures === undefined &&
      localFeatures.staticFeatures === undefined)
  ) {
    return contextFeatures;
  } else {
    return {
      dynamicFeatures:
        localFeatures.dynamicFeatures ?? contextFeatures.dynamicFeatures,
      tableFeatures:
        localFeatures.tableFeatures ?? contextFeatures.tableFeatures,
      staticFeatures:
        localFeatures.staticFeatures ?? contextFeatures.staticFeatures,
    };
  }
};
