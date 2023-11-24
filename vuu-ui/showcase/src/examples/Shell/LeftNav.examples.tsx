import { LeftNav } from "@finos/vuu-shell";

let displaySequence = 0;

export const VerticalTabstrip = () => {
  return <LeftNav features={[]} tableFeatures={[]} />;
};
VerticalTabstrip.displaySequence = displaySequence++;

export const VerticalTabstripCollapsed = () => {
  return <LeftNav defaultExpanded={false} features={[]} tableFeatures={[]} />;
};
VerticalTabstripCollapsed.displaySequence = displaySequence++;

export const VerticalTabstripCollapsedContent = () => {
  return (
    <LeftNav
      defaultActiveTabIndex={1}
      defaultExpanded={false}
      features={[]}
      tableFeatures={[]}
    />
  );
};
VerticalTabstripCollapsedContent.displaySequence = displaySequence++;

export const VerticalTabstripContent = () => {
  return (
    <LeftNav
      defaultActiveTabIndex={1}
      defaultExpanded
      features={[]}
      tableFeatures={[]}
    />
  );
};
VerticalTabstripContent.displaySequence = displaySequence++;
