import { LeftNav } from "@finos/vuu-shell";

let displaySequence = 0;

export const VerticalTabstrip = () => {
  return <LeftNav features={[]} tableFeatures={[]} />;
};
VerticalTabstrip.displaySequence = displaySequence++;

export const VerticalTabstripCollapsed = () => {
  return (
    <LeftNav
      defaultDisplayStatus="menu-icons"
      features={[]}
      tableFeatures={[]}
    />
  );
};
VerticalTabstripCollapsed.displaySequence = displaySequence++;

export const VerticalTabstripCollapsedContent = () => {
  return (
    <LeftNav
      defaultActiveTabIndex={1}
      defaultDisplayStatus="menu-icons-content"
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
      defaultDisplayStatus="menu-full-content"
      features={[]}
      tableFeatures={[]}
    />
  );
};
VerticalTabstripContent.displaySequence = displaySequence++;
