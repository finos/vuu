import {
  AriaAttributes,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
} from "react";

import { orientationType, OverflowSource } from "../responsive";
import { EditableLabelProps } from "../editable-label";
import { ExitEditModeHandler } from "./useEditableItem";
import { MenuActionHandler } from "packages/vuu-data-types";

export interface FocusAPI {
  focus: () => void;
}

export interface TabDescriptor extends OverflowSource {
  element?: JSX.Element;
}
export type TabsSource = string[] | TabDescriptor[];

export type navigationProps = Pick<TabProps, "onFocus" | "onKeyDown">;

export type composableTabProps = navigationProps &
  Pick<
    TabProps,
    "onClick" | "onEnterEditMode" | "onExitEditMode" | "onMouseDown"
  >;

export type TabstripVariant = "primary" | "tertiary";

export interface TabstripProps extends HTMLAttributes<HTMLDivElement> {
  /**
   *  index value of Active Tab. Set to `null` for no active tab.
   */
  activeTabIndex?: number | null;

  /**
   * Boolean that enables add new tab
   */

  allowAddTab?: boolean;

  /**
   * when true Tabs may be re-arranged by dragging individual Tabs to new position within Tabstrip.
   */
  allowDragDrop?: boolean;

  /**
   * when true Tabs may be closed by user. This can be overridden on each individual Tab
   */
  allowCloseTab?: boolean;

  /**
   * when true Tab labels may be edited by user. This can be overridden on each individual Tab
   */
  allowRenameTab?: boolean;

  /**
   * Boolean that indicates if tabs are centered on the container
   */
  centered?: boolean;
  defaultSource?: TabsSource;
  /**
   *  index value of Selected Tab, used in uncontrolled mode
   */
  defaultActiveTabIndex?: number;

  editing?: boolean;
  keyBoardActivation?: "manual" | "automatic";
  /**
   * A custom context menu location for TabMenu
   */
  location?: string;
  /**
   * callback that fires when user has clicked Add Tab button.
   * client is responsible for re-render with additional tab.
   * It is also responsibility of client to select tne new tab
   * by setting activeTabIndex, if that is the desired behaviour.
   */
  onAddTab?: () => void;
  onActiveChange?: (tabIndex: number) => void;
  /**
   * callback that fires when user has opted to remove tab.
   * client is responsible for re-render with tab removed.
   * It is also responsibility of client to select tne new tab
   * by setting activeTabIndex, a suggested value for this is
   * provided by newActiveTabIndex.
   */
  onCloseTab?: (tabIndex: number, newActiveTabIndex: number) => void;
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  orientation?: orientationType;
  onEnterEditMode?: () => void;
  onExitEditMode?: ExitEditModeHandler;
  /**
   * Boolean that indicates whether to enable overflow dropdown or not
   */
  overflowMenu?: boolean;
  promptForNewTabName?: boolean;
  /**
   * Set variant - defaults 'primary'
   */
  variant?: TabstripVariant;
}

export type exitEditHandler = (
  originalValue: string,
  editedValue: string,
  allowDeactivation: boolean,
  tabIndex: number
) => void;

export interface responsiveDataAttributes {
  "data-index": number;
  "data-overflowed"?: boolean;
  "data-priority": number;
}

export type TabProps = Omit<
  HTMLAttributes<HTMLElement>,
  "onClick" | "onKeyUp"
> & {
  ariaControls?: AriaAttributes["aria-controls"];
  closeable?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  editable?: boolean;
  editing?: EditableLabelProps["editing"];
  focused?: boolean;
  // DO we need this as well as focussed ?
  focusVisible?: boolean;
  focusedChildIndex?: number;
  location?: string;
  selected?: boolean;
  showMenuButton?: boolean;
  index?: number;
  label?: EditableLabelProps["defaultValue"];
  onClick?: (e: MouseEvent<HTMLElement>, index: number) => void;
  onClose?: (index: number) => void;
  onEnterEditMode?: () => void;
  onExitEditMode?: exitEditHandler;
  onKeyUp?: (e: KeyboardEvent, index: number) => void;
  onMenuAction?: MenuActionHandler;
  onMenuClose?: () => void;
  orientation?: "horizontal" | "vertical";
};

export type TabElement = ReactElement<TabProps>;
