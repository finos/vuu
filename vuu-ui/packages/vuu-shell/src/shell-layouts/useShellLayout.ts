import { ReactElement } from "react";
import { useFullHeightLeftPanel } from "./useFullHeightLeftPanel";
import { useInlayLeftPanel } from "./useInlayLeftPanel";

export interface ShellLayoutProps {
  appHeader?: ReactElement;
  leftSidePanel?: ReactElement;
  leftSidePanelLayout?: "full-height" | "inlay";
}

export const useShellLayout = ({
  leftSidePanelLayout = "inlay",
  ...props
}: ShellLayoutProps) => {
  const useLayoutHook =
    leftSidePanelLayout === "inlay"
      ? useInlayLeftPanel
      : useFullHeightLeftPanel;

  return useLayoutHook(props);
};
