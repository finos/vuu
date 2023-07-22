import { TabstripNextProps as TabstripProps } from "@finos/vuu-ui-controls";
import { HTMLAttributes, MouseEvent, ReactElement, ReactNode } from "react";

export interface StackProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onMouseDown"> {
  active?: number;
  createNewChild?: (index: number) => ReactElement;
  getTabIcon?: (component: ReactElement, index: number) => string | undefined;
  getTabLabel?: (component: ReactElement, index: number) => string | undefined;
  keyBoardActivation?: "automatic" | "manual";
  onAddTab?: () => void;
  onMouseDown?: (e: MouseEvent, tabIndex: number) => void;
  onTabClose?: (tabIndex: number) => void;
  onTabEdit?: (tabIndex: number, label: string) => void;
  onTabSelectionChanged?: (nextIndex: number) => void;
  path?: string;
  showTabs?: boolean;
  toolbarContent?: ReactNode;
  TabstripProps?: Partial<TabstripProps>;
}
