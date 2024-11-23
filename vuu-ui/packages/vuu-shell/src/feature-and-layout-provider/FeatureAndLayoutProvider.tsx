import {
  DynamicFeatureDescriptor,
  DynamicFeatureProps,
  FilterTableFeatureProps,
  StaticFeatureDescriptor,
  SystemLayoutMetadata,
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

export interface LayoutContextProps {
  systemLayouts?: SystemLayoutMetadata[];
}

const NO_FEATURES: DynamicFeatureDescriptor[] = [];
const NO_STATICFEATURES: StaticFeatureDescriptor[] = [];
const NO_SYSTEMLAYOUTS: SystemLayoutMetadata[] = [];

const NO_FEATURES_VUU = {
  dynamicFeatures: NO_FEATURES,
  tableFeatures: NO_FEATURES,
};

const FeatureContext = createContext<FeatureContextProps>({
  dynamicFeatures: NO_FEATURES,
  tableFeatures: NO_FEATURES,
  staticFeatures: NO_STATICFEATURES,
});

const LayoutContext = createContext<LayoutContextProps>({
  systemLayouts: NO_SYSTEMLAYOUTS,
});

export interface FeatureAndLayoutProviderProps
  extends Partial<FeatureContextProps> {
  children: ReactNode;
  dynamicFeatures?: DynamicFeatureDescriptor[];
  staticFeatures?: StaticFeatureDescriptor[];
  systemLayouts?: SystemLayoutMetadata[];
}

export const FeatureAndLayoutProvider = ({
  children,
  dynamicFeatures: dynamicFeaturesProp = [],
  staticFeatures,
  systemLayouts,
}: FeatureAndLayoutProviderProps): ReactElement => {
  const tableSchemas = useVuuTables();
  const { dynamicFeatures, tableFeatures } = useMemo<{
    dynamicFeatures: DynamicFeatureProps[];
    tableFeatures: DynamicFeatureProps<FilterTableFeatureProps>[];
  }>(
    () =>
      tableSchemas
        ? getCustomAndTableFeatures(dynamicFeaturesProp, tableSchemas)
        : NO_FEATURES_VUU,
    [dynamicFeaturesProp, tableSchemas],
  );

  return (
    <FeatureContext.Provider
      value={{
        dynamicFeatures,
        tableFeatures,
        staticFeatures,
      }}
    >
      <LayoutContext.Provider
        value={{
          systemLayouts,
        }}
      >
        {children}
      </LayoutContext.Provider>
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => useContext(FeatureContext);
export const useLayouts = () => useContext(LayoutContext);
