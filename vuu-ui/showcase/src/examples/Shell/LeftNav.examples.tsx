import { LeftNav } from "@vuu-ui/vuu-shell";

export const VerticalTabstrip = () => {
  return <LeftNav />;
};

export const VerticalTabstripCollapsed = () => {
  return <LeftNav defaultExpanded={false} />;
};

export const VerticalTabstripCollapsedContent = () => {
  return <LeftNav defaultActiveTabIndex={1} defaultExpanded={false} />;
};

export const VerticalTabstripContent = () => {
  return <LeftNav defaultActiveTabIndex={1} defaultExpanded />;
};
