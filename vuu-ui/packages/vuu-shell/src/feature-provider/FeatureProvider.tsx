import {
  DynamicFeatureDescriptor,
  DynamicFeatureProps,
  FilterTableFeatureProps,
  StaticFeatureDescriptor,
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
  dynamicFeatures?: DynamicFeatureProps[];
  tableFeatures?: DynamicFeatureProps<FilterTableFeatureProps>[];
  staticFeatures?: StaticFeatureDescriptor[];
}

const NO_FEATURES: DynamicFeatureDescriptor[] = [];
const NO_STATICFEATURES: StaticFeatureDescriptor[] = [];

const NO_FEATURES_VUU = {
  dynamicFeatures: NO_FEATURES,
  tableFeatures: NO_FEATURES,
};

const FeatureContext = createContext<FeatureContextProps>({
  dynamicFeatures: NO_FEATURES,
  tableFeatures: NO_FEATURES,
  staticFeatures: NO_STATICFEATURES,
});

export interface FeatureProviderProps extends Partial<FeatureContextProps> {
  children: ReactNode;
  dynamicFeatures?: DynamicFeatureDescriptor[];
  staticFeatures?: StaticFeatureDescriptor[];
}

export const FeatureProvider = ({
  children,
  dynamicFeatures: dynamicFeaturesProp = [],
  staticFeatures,
}: FeatureProviderProps): ReactElement => {
  const vuuTables = useVuuTables();
  const { dynamicFeatures, tableFeatures } = useMemo<{
    dynamicFeatures: DynamicFeatureProps[];
    tableFeatures: DynamicFeatureProps<FilterTableFeatureProps>[];
  }>(
    () =>
      vuuTables
        ? getCustomAndTableFeatures(dynamicFeaturesProp, vuuTables)
        : NO_FEATURES_VUU,
    [dynamicFeaturesProp, vuuTables],
  );

  console.log({ tableFeatures });

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

export const useFeatures = () => useContext(FeatureContext);
