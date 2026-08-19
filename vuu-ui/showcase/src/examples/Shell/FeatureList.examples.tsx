import { FeatureList, GroupedFeatureProps } from "@vuu-ui/vuu-shell";
import { DynamicFeatureProps } from "@vuu-ui/vuu-utils";

export const DefaultFeatureList = () => {
  const features: DynamicFeatureProps[] = [
    { title: "Component 1", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    { title: "Component 2", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    { title: "Component 3", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    { title: "Component 4", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
  ];

  return <FeatureList features={features} style={{ width: 300 }} />;
};

export const FeatureListWithTitle = () => {
  const features: DynamicFeatureProps[] = [
    { title: "Component 1", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    { title: "Component 2", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    { title: "Component 3", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    { title: "Component 4", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
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
      { title: "Component 1", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 2", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 3", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 4", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    ],
    "My Components": [
      { title: "My First Component", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Another component", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Life's a component", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
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
      { title: "Component 1", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 2", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 3", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 4", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 5", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 6", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 7", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 8", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 9", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 10", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 11", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 12", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 13", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 14", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component 15", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
    ],
    "My Components": [
      { title: "My First Component", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Another component", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Life's a component", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Component schmonent", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Compo, Clegg & Truly", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "Components are a girls best friend", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
      { title: "The Component from U.N.C.L.E.", mfUrl: "test", mfComponent: "Test", mfScope: "test" },
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
