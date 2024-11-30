import { FeatureList, GroupedFeatureProps } from "@finos/vuu-shell";
import { DynamicFeatureProps } from "@finos/vuu-utils";

export const DefaultFeatureList = () => {
  const features: DynamicFeatureProps[] = [
    { title: "Component 1", url: "test" },
    { title: "Component 2", url: "test" },
    { title: "Component 3", url: "test" },
    { title: "Component 4", url: "test" },
  ];

  return <FeatureList features={features} style={{ width: 300 }} />;
};

export const FeatureListWithTitle = () => {
  const features: DynamicFeatureProps[] = [
    { title: "Component 1", url: "test" },
    { title: "Component 2", url: "test" },
    { title: "Component 3", url: "test" },
    { title: "Component 4", url: "test" },
  ];

  return (
    <FeatureList
      features={features}
      style={{ width: 300 }}
      title="Custom Title"
    />
  );
};

export const FeatureListWithGroups = () => {
  const features: GroupedFeatureProps = {
    "System Components": [
      { title: "Component 1", url: "test" },
      { title: "Component 2", url: "test" },
      { title: "Component 3", url: "test" },
      { title: "Component 4", url: "test" },
    ],
    "My Components": [
      { title: "My First Component", url: "test" },
      { title: "Another component", url: "test" },
      { title: "Life's a component", url: "test" },
    ],
  };

  return (
    <FeatureList
      features={features}
      style={{ width: 300 }}
      title="Grouped Components"
    />
  );
};

export const FeatureListWithGroupsManyItems = () => {
  const features: GroupedFeatureProps = {
    "System Components": [
      { title: "Component 1", url: "test" },
      { title: "Component 2", url: "test" },
      { title: "Component 3", url: "test" },
      { title: "Component 4", url: "test" },
      { title: "Component 5", url: "test" },
      { title: "Component 6", url: "test" },
      { title: "Component 7", url: "test" },
      { title: "Component 8", url: "test" },
      { title: "Component 9", url: "test" },
      { title: "Component 10", url: "test" },
      { title: "Component 11", url: "test" },
      { title: "Component 12", url: "test" },
      { title: "Component 13", url: "test" },
      { title: "Component 14", url: "test" },
      { title: "Component 15", url: "test" },
    ],
    "My Components": [
      { title: "My First Component", url: "test" },
      { title: "Another component", url: "test" },
      { title: "Life's a component", url: "test" },
      { title: "Component schmonent", url: "test" },
      { title: "Compo, Clegg & Truly", url: "test" },
      { title: "Components are a girls best friend", url: "test" },
      { title: "The Component from U.N.C.L.E.", url: "test" },
    ],
  };

  return (
    <FeatureList
      features={features}
      style={{ width: 300 }}
      title="Grouped Components"
    />
  );
};
