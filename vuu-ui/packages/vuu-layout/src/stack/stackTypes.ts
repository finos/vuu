import { TabstripProps } from "@finos/vuu-ui-controls";
import { HTMLAttributes, MouseEvent, ReactElement, ReactNode } from "react";

export type TabPosition = "top" | "left" | "right" | "bottom";
export interface StackProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onMouseDown"> {
  active?: number;
  createNewChild?: (index: number) => ReactElement;
  getTabIcon?: (component: ReactElement, index: number) => string | undefined;
  getTabLabel?: (component: ReactElement, index: number) => string | undefined;
  keyBoardActivation?: "automatic" | "manual";
  onAddTab?: () => void;
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  onMouseDown?: (e: MouseEvent, tabIndex: number) => void;
  onTabClose?: (tabIndex: number) => void;
  onTabEdit?: (tabIndex: number, label: string) => void;
  onTabSelectionChanged?: (nextIndex: number) => void;
  path?: string;
  /** should the Stack display a Tabstrip and where ? default top */
  showTabs?: false | TabPosition;
  toolbarContent?: ReactNode;
  TabstripProps?: Partial<TabstripProps>;
}
