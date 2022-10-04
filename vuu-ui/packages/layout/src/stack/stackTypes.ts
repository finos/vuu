import { HTMLAttributes, MouseEvent, ReactElement, ReactNode } from "react";

export interface StackProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onMouseDown"> {
  active?: number;
  createNewChild?: (index: number) => ReactElement;
  enableAddTab?: boolean;
  enableCloseTabs?: boolean;
  getTabLabel?: (component: ReactElement, index: number) => string;
  keyBoardActivation?: "automatic" | "manual";
  onMouseDown?: (e: MouseEvent, tabIndex: number) => void;
  onTabAdd?: (tabIndex: number) => void;
  onTabClose?: (tabIndex: number) => void;
  onTabEdit?: (evt: any, tabIndex: number, label: string) => void;
  onTabSelectionChanged?: (nextIndex: number) => void;
  path?: string;
  showTabs?: boolean;
  toolbarContent?: ReactNode;
}
