import { ReactElement } from "react";
import { ShellProps } from "../shell";
import { useFullHeightLeftPanel } from "./useFullHeightLeftPanel";
import { useInlayLeftPanel } from "./useInlayLeftPanel";

export type ShellLayoutType = "full-height" | "inlay";
export interface ShellLayoutProps {
  LeftSidePanelProps: ShellProps["LeftSidePanelProps"];
  appHeader: ReactElement;
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
