import { LeftNav } from "@finos/vuu-shell";

let displaySequence = 0;

export const VerticalTabstrip = () => {
  return <LeftNav />;
};
VerticalTabstrip.displaySequence = displaySequence++;

export const VerticalTabstripCollapsed = () => {
  return <LeftNav defaultExpanded={false} />;
};
VerticalTabstripCollapsed.displaySequence = displaySequence++;

export const VerticalTabstripCollapsedContent = () => {
  return <LeftNav defaultActiveTabIndex={1} defaultExpanded={false} />;
};
VerticalTabstripCollapsedContent.displaySequence = displaySequence++;

export const VerticalTabstripContent = () => {
  return <LeftNav defaultActiveTabIndex={1} defaultExpanded />;
};
VerticalTabstripContent.displaySequence = displaySequence++;
