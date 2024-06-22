import type {
  AriaAttributes,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
} from "react";
import { orientationType } from "@finos/vuu-utils";

import type { EditableLabelProps } from "../editable-label";
import type { MenuActionHandler } from "@finos/vuu-data-types";

export type ExitTabEditModeHandler = (
  originalValue: string,
  editedValue: string,
  allowDeactivation: boolean,
  tabIndex: number
) => void;

export interface FocusAPI {
  focus: () => void;
}

export type navigationProps = Pick<TabProps, "onFocus" | "onKeyDown">;

export type composableTabProps = navigationProps &
  Pick<
    TabProps,
    "onClick" | "onEnterEditMode" | "onExitEditMode" | "onMouseDown"
  >;

export type TabstripVariant = "primary" | "tertiary";

export interface TabstripProps extends HTMLAttributes<HTMLDivElement> {
  /**
   *  index value of Active Tab.
   */
  activeTabIndex: number;

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

  animateSelectionThumb?: boolean;

  /**
   * Boolean that indicates if tabs are centered on the container
   */
  centered?: boolean;
  /**
   *  index value of Selected Tab, used in uncontrolled mode
   */
  defaultActiveTabIndex?: number;

  editing?: boolean;
  keyBoardActivation?: "manual" | "automatic";
  /**
   * A custom context menu location for TabMenu, applied to all tabs
   */
  location?: string;
  /**
   * callback that fires when user has clicked Add Tab button.
   * client is responsible for re-render with additional tab.
   * It is also responsibility of client to select tne new tab
   * by setting activeTabIndex, if that is the desired behaviour.
   */
  onAddTab?: () => void;
  /**
   * callback that fires when tab selection changes
   */
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
  /**
   * vertical or horizontal (default)
   */
  orientation?: orientationType;
  onEnterEditMode?: () => void;
  onExitEditMode?: ExitTabEditModeHandler;
  /**
   * Boolean that indicates whether to enable overflow dropdown or not
   */
  overflowMenu?: boolean;
  promptForNewTabName?: boolean;
  /**
   * Should each tab render a popup menu. Default is false if tab is
   * not closeable, not renameable and has no tab-location , otherwise true.
   */
  showTabMenuButton?: boolean;
  /**
   * An optional classname that will be added to each tab
   */
  tabClassName?: string;

  /**
   * An optional classifier, used to create a classname, intended
   * for promary vs secondary bavigation.
   */
  variant?: "primary" | "secondary";
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
  /**
   * index is injected by the Tabstrip is need not be specified by client
   */
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
