import { TabstripProps } from "@vuu-ui/vuu-ui-controls";
import { HTMLAttributes, MouseEvent, ReactElement, ReactNode } from "react";

export type TabLabelFactory = (
  component: ReactElement,
  index: number,
  existingLabels: string[],
) => string;

export interface SerializableStackProps {
  active?: number;
  /** should the Stack display a Tabstrip and where ? default top */
  showTabs?: false | TabPosition;
}

export type TabPosition = "top" | "left" | "right" | "bottom";
export interface StackProps
  extends SerializableStackProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onMouseDown"> {
  TabstripProps?: Partial<TabstripProps>;
  createNewChild?: (index: number) => ReactElement;
  getTabIcon?: (component: ReactElement, index: number) => string | undefined;
  getTabLabel?: TabLabelFactory;
  keyBoardActivation?: "automatic" | "manual";
  onAddTab?: () => void;
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  onMouseDown?: (e: MouseEvent, tabIndex: number) => void;
  onTabClose?: (tabIndex: number) => void;
  onTabEdit?: (tabIndex: number, label: string) => void;
  onTabSelectionChanged?: (nextIndex: number) => void;
  path?: string;
  toolbarContent?: ReactNode;
}
