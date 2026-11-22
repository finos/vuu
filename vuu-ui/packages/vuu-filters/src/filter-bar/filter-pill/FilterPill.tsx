import { Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
} from "@vuu-ui/vuu-context-menu";
import { ColumnDescriptorsByName, Filter } from "@vuu-ui/vuu-filter-types";
import {
  EditableLabel,
  EditableLabelProps,
  ExitEditModeHandler,
  PopupMenuProps,
  SplitStateButton,
  SplitStateButtonProps,
} from "@vuu-ui/vuu-ui-controls";
import { dispatchMouseEvent } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { MouseEventHandler, useCallback, useMemo, useRef } from "react";
import {
  closeCommand,
  deleteCommand,
  editCommand,
  MenuOptions,
  renameCommand,
} from "../filter-pill-menu/FilterPillMenuOptions";
import { filterAsReactNode } from "./filterAsReactNode";
import { getFilterLabel } from "./getFilterLabel";
import { getFilterAsFormattedText } from "../../filter-pill/getFilterTooltipText";

import filterPillCss from "./FilterPill.css";

const classBase = "vuuFilterPill";

export interface FilterPillProps
  extends SplitStateButtonProps,
    Pick<
      Partial<EditableLabelProps>,
      "editing" | "editLabelApiRef" | "onExitEditMode"
    > {
  allowClose?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
  allowRename?: boolean;

  columnsByName?: ColumnDescriptorsByName;
  editable?: boolean;
  filter: Filter;
  index?: number;
  onBeginEdit?: (filter: Filter) => void;
  onMenuAction?: MenuActionHandler;
}

export const FilterPill = ({
  allowClose = true,
  allowDelete = true,
  allowEdit = true,
  allowRename = true,
  className: classNameProp,
  columnsByName,
  editable = true,
  editing = false,
  editLabelApiRef,
  filter,
  onBeginEdit,
  onExitEditMode,
  onMenuAction,
  ...htmlAttributes
}: FilterPillProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-pill",
    css: filterPillCss,
    window: targetWindow,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const handleEnterEditMode: EditableLabelProps["onEnterEditMode"] =
    useCallback(() => {
      onBeginEdit?.(filter);
    }, [filter, onBeginEdit]);

  const getLabel = getFilterLabel(columnsByName);
  const label = useMemo(
    () => filter.name ?? getLabel(filter),
    [getLabel, filter],
  );

  const getTooltipText = getFilterAsFormattedText(columnsByName);

  const popupMenuProps = useMemo<
    Pick<
      PopupMenuProps,
      | "menuBuilder"
      | "menuActionHandler"
      | "menuClassName"
      | "menuOptions"
      | "onMenuClose"
    >
  >(
    () => ({
      icon: "more-vert",
      menuBuilder: (_location, options) => {
        const menuItems: ContextMenuItemDescriptor[] = [];
        if (allowRename) {
          menuItems.push(renameCommand(options as MenuOptions));
        }
        if (allowEdit) {
          menuItems.push(editCommand(options as MenuOptions));
        }
        if (allowClose) {
          menuItems.push(closeCommand(options as MenuOptions));
        }
        if (allowDelete) {
          menuItems.push(deleteCommand(options as MenuOptions));
        }
        return menuItems;
      },

      menuActionHandler: onMenuAction,
      menuClassName: `${classBase}-menu`,
      menuLocation: "filter-pill-menu",
      menuOptions: {
        filter,
      },
    }),
    [allowClose, allowDelete, allowEdit, allowRename, filter, onMenuAction],
  );

  // The menu trigger is only visible on hover or focus, right-click is
  // another way to open the menu.
  const handleContextMenu = useCallback<MouseEventHandler<HTMLDivElement>>(
    (evt) => {
      const trigger = rootRef.current?.querySelector<HTMLElement>(
        ".vuuSplitButton-trigger",
      );
      if (trigger) {
        evt.preventDefault();
        evt.stopPropagation();
        dispatchMouseEvent(trigger, "mousedown");
      }
    },
    [],
  );

  const handleExitEditMode = useCallback<ExitEditModeHandler>(
    (originalValue, newValue) => {
      onExitEditMode?.(originalValue, newValue);
      requestAnimationFrame(() => {
        rootRef.current?.querySelector("button")?.focus();
      });
    },
    [onExitEditMode],
  );

  return (
    <Tooltip
      className={`${classBase}-tooltip`}
      content={filterAsReactNode(filter, getTooltipText)}
      placement="top"
    >
      <SplitStateButton
        {...htmlAttributes}
        PopupMenuProps={popupMenuProps}
        className={cx(classBase, classNameProp)}
        data-text={label}
        onContextMenu={handleContextMenu}
        ref={rootRef}
      >
        {editable && onExitEditMode ? (
          <EditableLabel
            defaultValue={label}
            editing={editing}
            editLabelApiRef={editLabelApiRef}
            key={label}
            onEnterEditMode={handleEnterEditMode}
            onExitEditMode={handleExitEditMode}
          />
        ) : (
          label
        )}
      </SplitStateButton>
    </Tooltip>
  );
};
