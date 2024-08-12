import { FeatureList, useFeatures } from "@finos/vuu-shell";
import { StaticFeatures } from "@finos/vuu-utils";
import { FeatureProvider } from "@finos/vuu-shell";

let displaySequence = 1;

const staticFeatures: StaticFeatures = {
  feature1: { label: "label1", type: "Placeholder" },
  feature2: { label: "label2", type: "Component" },
  feature3: { label: "label3", type: "Placeholder" },
  feature4: { label: "label4", type: "View" },
  feature5: { label: "label5", type: "Placeholder" },
};

const StaticFeaturesTemplate = () => {
  const features = useFeatures();
  if (features.staticFeatures)
    return (
      <>
        <FeatureList features={features.staticFeatures} isStatic />
        <FeatureList features={features.dynamicFeatures} />
        <FeatureList features={features.tableFeatures} />
      </>
    );
  else
    return (
      <>
        <FeatureList features={features.dynamicFeatures} />
        <FeatureList features={features.tableFeatures} />
      </>
    );
};

export const DefaultStaticFeatures = () => {
  return (
    <FeatureProvider features={{}} staticFeatures={staticFeatures}>
      <StaticFeaturesTemplate />
    </FeatureProvider>
  );
};
DefaultStaticFeatures.displaySequence = displaySequence++;
