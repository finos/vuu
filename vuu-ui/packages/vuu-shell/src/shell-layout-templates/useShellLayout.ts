import { HTMLAttributes, ReactElement, ReactNode } from "react";
import { useFullHeightLeftPanel } from "./full-height-left-panel/useFullHeightLeftPanel";
import { useInlayLeftPanel } from "./inlay-left-panel/useInlayLeftPanel";
import { useLeftMainTabs } from "./left-main-tabs/useLeftMainTabs";
import { useSimpleContentPane } from "./simple-content-pane/useSimpleContentPane";
import { SidePanelProps as ShellSidePanelProps } from "./side-panel";

const LayoutHook = {
  "full-height": useFullHeightLeftPanel,
  inlay: useInlayLeftPanel,
  "left-main-tabs": useLeftMainTabs,
  "simple-content-pane": useSimpleContentPane,
};

export type LayoutTemplateId = keyof typeof LayoutHook;

export type ShellLayoutTemplateProps = Omit<
  ShellLayoutProps,
  "layoutTemplateId"
>;

export type ShellToolbarProps = {
  children: ReactNode;
  position?: "left";
  width?: number;
};

export type ShellLayoutTemplateHook = (
  props: ShellLayoutTemplateProps,
) => ReactElement;

/**
 * The Shell Layout is the outermost 'chrome' of the appliciation,
 * enclosing the main content area. It will be rendered by one of
 * two available templates, determined by the layoutTemplateId,
 */
export interface ShellLayoutProps {
  /**
   * App Header will be rendered in position determined by layout-template
   */
  appHeader?: ReactNode;

  /**
   * HTML attributes that will be applied to root div.
   */
  htmlAttributes?: HTMLAttributes<HTMLDivElement>;
  /**
   * identifier for shell layout template to be used. Default template
   * will be "inlay"
   */
  layoutTemplateId?: LayoutTemplateId;
  /**
   * If template renders SidePanel, these props will be provided
   */
  SidePanelProps?: ShellSidePanelProps;
  /**
   * If template renders Toolbar, these props will be provided
   */
  ToolbarProps?: ShellToolbarProps;
}

/**
 * This hook acts as a stub for the actual shell layout
 * template hooks. It will delegate to the appropriate shell
 * layout hook, based on the value of layoutTemplateId.
 */
export const useShellLayout = ({
  layoutTemplateId = "simple-content-pane",
  ...props
}: ShellLayoutProps) => {
  const useLayoutHook = LayoutHook[layoutTemplateId];
  return useLayoutHook(props);
};
