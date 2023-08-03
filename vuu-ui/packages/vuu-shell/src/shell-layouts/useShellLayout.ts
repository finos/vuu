import { ReactElement } from "react";
import { useFullHeightLeftPanel } from "./useFullHeightLeftPanel";
import { useInlayLeftPanel } from "./useInlayLeftPanel";

export type ShellLayoutType = "full-height" | "inlay";
export interface ShellLayoutProps {
  appHeader: ReactElement;
  leftSidePanel?: ReactElement;
}

export const useShellLayout = ({
  leftSidePanelLayout = "inlay",
  ...props
}:
  | ShellLayoutProps & {
      leftSidePanelLayout?: "full-height" | "inlay";
    }) => {
  const useLayoutHook =
    leftSidePanelLayout === "inlay"
      ? useInlayLeftPanel
      : useFullHeightLeftPanel;

  return useLayoutHook(props);
};
