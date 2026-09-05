import { useVuuTables } from "@vuu-ui/vuu-data-react";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getCustomAndTableFeatures,
  type DynamicFeatureDescriptor,
  type DynamicFeatureProps,
  type FilterTableFeatureProps,
} from "./types";

type FeatureContextValue = {
  dynamicFeatures: DynamicFeatureProps[];
  tableFeatures: DynamicFeatureProps<FilterTableFeatureProps>[];
};

const FeatureContext = createContext<FeatureContextValue>({
  dynamicFeatures: [],
  tableFeatures: [],
});

export const LegacyFeatureAndLayoutProvider = ({
  children,
  dynamicFeatures,
}: {
  children: ReactNode;
  dynamicFeatures: DynamicFeatureDescriptor[];
}) => {
  const tableSchemas = useVuuTables();
  const features = useMemo(
    () =>
      tableSchemas
        ? getCustomAndTableFeatures(dynamicFeatures, tableSchemas)
        : { dynamicFeatures: [], tableFeatures: [] },
    [dynamicFeatures, tableSchemas],
  );

  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useLegacyFeatures = () => useContext(FeatureContext);
