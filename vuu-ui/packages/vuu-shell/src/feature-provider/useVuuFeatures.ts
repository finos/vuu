// import { useVuuTables } from "@finos/vuu-data-react";
// import {
//   DynamicFeatures,
//   FeatureProps,
//   FilterTableFeatureProps,
//   getCustomAndTableFeatures,
// } from "@finos/vuu-utils";
// import { useMemo } from "react";
// import { FeatureContextProps } from "./FeatureProvider";

// export interface FeaturesHookProps {
//   dynamicFeatures: DynamicFeatures;
// }

// const NO_FEATURES: {
//   vuuFeatures: FeatureProps[];
//   vuuTableFeatures: FeatureProps<FilterTableFeatureProps>[];
// } = { vuuFeatures: [], vuuTableFeatures: [] };

// export const useVuuFeatures = ({
//   dynamicFeatures: features,
// }: FeaturesHookProps): FeatureContextProps => {
//   const tables = useVuuTables();
//   const { vuuFeatures, vuuTableFeatures } = useMemo<{
//     vuuFeatures: FeatureProps[];
//     vuuTableFeatures: FeatureProps<FilterTableFeatureProps>[];
//   }>(
//     () => (tables ? getCustomAndTableFeatures(features, tables) : NO_FEATURES),
//     [features, tables]
//   );

//   return {
//     dynamicFeatures: vuuFeatures,
//     tableFeatures: vuuTableFeatures,
//   };
// };

// const vuuTables = useVuuTables();
// console.log("vuutable: ", vuuTables);
// const { vuuFeatures, vuuTableFeatures } = useMemo<{
//   vuuFeatures: FeatureProps[];
//   vuuTableFeatures: FeatureProps<FilterTableFeatureProps>[];
// }>(() => {
//   console.log("vuutable");
//   const a = vuuTables
//     ? getCustomAndTableFeatures(features, vuuTables)
//     : NO_FEATURES_VUU;
//   return a;
// }, [features, vuuTables]);
// console.log("vuuFeature: ", vuuFeatures);
// console.log("table: ", vuuTableFeatures);
