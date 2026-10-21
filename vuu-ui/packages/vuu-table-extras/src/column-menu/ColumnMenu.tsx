import { Menu, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import {
  ColumnDescriptor,
  ColumnMenuPermissions,
} from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import {
  type ComponentProps,
  type FocusEventHandler,
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTableContext } from "../table-provider/TableProvider";
import {
  buildAggregationMenuItems,
  buildGroupMenu,
  buildPinMenuItems,
  buildSortMenu,
  buildVisibilityMenuItems,
  ColumnMenuActionType,
  getColumnMenuActionType,
  type MenuItemClickHandler,
} from "./column-menu-utils";

import columnMenuCss from "./ColumnMenu.css";

const classBase = "vuuColumnMenu";

const defaultColumnMenuPermissions: Readonly<ColumnMenuPermissions> = {
  allowSort: true,
  allowGroup: true,
  allowAggregation: true,
  allowHide: true,
  allowRemove: true,
  allowPin: true,
};

export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: ColumnDescriptor;
  menuActionHandler?: MenuActionHandler<ColumnMenuActionType, ColumnDescriptor>;
  menuPermissions?: ColumnMenuPermissions;
}

const stopPropagation: MouseEventHandler<HTMLButtonElement> = (evt) => {
  // Prevent sort from triggering if the click were to bubble.
  evt.stopPropagation();
};

type MountReason = "focus" | "click";

/**
 * Renders only the trigger button until a user shows interest in the menu.
 * A table has a column menu in every header cell, and the full menu (popup,
 * menu items, table context) is only needed for the one a user opens.
 *
 * A click mounts the full menu, already open. Keyboard focus mounts it
 * without opening it, and passes focus on to the new trigger (mounting
 * replaces the button), so the key press that follows reaches the real menu
 * trigger and opens the menu with focus inside it. Focus from a mouse click
 * is not :focus-visible and is left to the click, so the button is not
 * replaced between mouse down and mouse up.
 */
export const ColumnMenu = (props: ColumnMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-menu",
    css: columnMenuCss,
    window: targetWindow,
  });
  const [mountReason, setMountReason] = useState<MountReason>();

  const mountOnKeyboardFocus = useCallback<
    FocusEventHandler<HTMLButtonElement>
  >((evt) => {
    if (evt.currentTarget.matches(":focus-visible")) {
      setMountReason("focus");
    }
  }, []);
  const mountOnClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      evt.stopPropagation();
      setMountReason("click");
    },
    [],
  );

  return mountReason ? (
    <ColumnMenuContent
      {...props}
      focusTriggerOnMount={mountReason === "focus"}
      openOnMount={mountReason === "click"}
    />
  ) : (
    <ColumnMenuButton
      className={props.className}
      onClick={mountOnClick}
      onFocus={mountOnKeyboardFocus}
    />
  );
};

/** Passes on the props and ref that MenuTrigger adds to its child */
const ColumnMenuButton = ({
  className,
  ...props
}: Omit<ComponentProps<typeof IconButton>, "icon">) => (
  <IconButton
    appearance="transparent"
    data-embedded
    icon="more-vert"
    sentiment="neutral"
    aria-label="Open Column Menu"
    {...props}
    className={cx(classBase, className)}
  />
);

const ColumnMenuContent = ({
  className,
  column,
  focusTriggerOnMount,
  openOnMount,
  menuActionHandler: menuActionHandlerProp,
  menuPermissions: {
    allowSort,
    allowGroup,
    allowAggregation,
    allowHide,
    allowRemove,
    allowPin,
  } = defaultColumnMenuPermissions,
}: ColumnMenuProps & {
  focusTriggerOnMount: boolean;
  openOnMount: boolean;
}) => {
  const { dataSource, menuActionHandler } = useTableContext(true);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // runs on mount only, the props are fixed for the life of this component
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useLayoutEffect(() => {
    if (focusTriggerOnMount) {
      triggerRef.current?.focus();
    }
  }, []);

  const menuActionClickHandler = useCallback<MenuItemClickHandler>(
    (evt) => {
      const columnMenuActionType = getColumnMenuActionType(evt.target);
      if (menuActionHandlerProp?.(columnMenuActionType, column) !== true) {
        return menuActionHandler(columnMenuActionType, column);
      }
    },
    [column, menuActionHandler, menuActionHandlerProp],
  );

  const sortMenu = buildSortMenu(
    column,
    dataSource,
    menuActionClickHandler,
    allowSort,
  );
  const groupMenu = buildGroupMenu(
    column,
    dataSource,
    menuActionClickHandler,
    allowGroup,
  );
  const aggregationMenu = buildAggregationMenuItems(
    column,
    dataSource,
    menuActionClickHandler,
    allowAggregation,
  );
  const visibilityMenuItems = buildVisibilityMenuItems(
    column,
    menuActionClickHandler,
    allowHide,
    allowRemove,
  );
  const pinMenu = buildPinMenuItems(column, menuActionClickHandler, allowPin);

  return (
    <Menu defaultOpen={openOnMount}>
      <MenuTrigger>
        <ColumnMenuButton
          className={className}
          onClick={stopPropagation}
          ref={triggerRef}
        />
      </MenuTrigger>
      <MenuPanel>
        {sortMenu}
        {groupMenu}
        {aggregationMenu}
        {visibilityMenuItems}
        {pinMenu}
      </MenuPanel>
    </Menu>
  );
};
