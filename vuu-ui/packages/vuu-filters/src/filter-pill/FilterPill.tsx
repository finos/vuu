import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
} from "@finos/vuu-data-types";
import { ColumnDescriptorsByName, Filter } from "@finos/vuu-filter-types";
import {
  PopupCloseCallback,
  PopupMenuProps,
  Tooltip,
  useTooltip,
} from "@finos/vuu-popups";
import {
  EditableLabel,
  EditableLabelProps,
  ExitEditModeHandler,
  SplitStateButton,
  SplitStateButtonProps,
} from "@finos/vuu-ui-controls";
import { useId } from "@finos/vuu-utils";
import cx from "clsx";
import { FocusEventHandler, useCallback, useMemo, useRef } from "react";
import { filterAsReactNode } from "./filterAsReactNode";
import {
  closeCommand,
  deleteCommand,
  editCommand,
  MenuOptions,
  renameCommand,
} from "./FilterPillMenuOptions";
import { getFilterLabel } from "./getFilterLabel";
import { getFilterTooltipText } from "./getFilterTooltipText";

import "./FilterPill.css";

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
  id: idProp,
  onBeginEdit,
  onExitEditMode,
  onMenuAction,
  ...htmlAttributes
}: FilterPillProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const handleEnterEditMode: EditableLabelProps["onEnterEditMode"] =
    useCallback(() => {
      onBeginEdit?.(filter);
    }, [filter, onBeginEdit]);

  const getLabel = getFilterLabel(columnsByName);
  const label = useMemo(
    () => filter.name ?? getLabel(filter),
    [getLabel, filter]
  );

  const getTooltipTextl = getFilterTooltipText(columnsByName);

  const id = useId(idProp);

  const handleMenuClose = useCallback<PopupCloseCallback>((reason) => {
    if (reason?.type === "escape") {
      requestAnimationFrame(() => {
        if (rootRef.current) {
          rootRef.current.focus();
        }
      });
    }
  }, []);

  const popupMenuProps = useMemo<
    Pick<
      PopupMenuProps,
      "menuBuilder" | "menuActionHandler" | "menuOptions" | "onMenuClose"
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
      menuLocation: "filter-pill-menu",
      menuOptions: {
        filter,
      },

      onMenuClose: handleMenuClose,
    }),
    [
      allowClose,
      allowDelete,
      allowEdit,
      allowRename,
      filter,
      handleMenuClose,
      onMenuAction,
    ]
  );

  const handleExitEditMode = useCallback<ExitEditModeHandler>(
    (originalValue, newValue) => {
      onExitEditMode?.(originalValue, newValue);
      requestAnimationFrame(() => {
        rootRef.current?.querySelector("button")?.focus();
      });
    },
    [onExitEditMode]
  );

  const { anchorProps, hideTooltip, showTooltip, tooltipProps } = useTooltip({
    anchorQuery: ".vuuFilterPill",
    id,
    placement: ["above", "below"],
    tooltipContent: filterAsReactNode(filter, getTooltipTextl),
  });

  const buttonProps = {
    onBlur: hideTooltip,
    onFocus: useCallback<FocusEventHandler>(() => {
      showTooltip(rootRef);
    }, [showTooltip]),
  };

  return (
    <SplitStateButton
      {...anchorProps}
      {...htmlAttributes}
      ButtonProps={buttonProps}
      PopupMenuProps={popupMenuProps}
      className={cx(classBase, classNameProp)}
      data-text={label}
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
      {tooltipProps && (
        <Tooltip className={`${classBase}-tooltip`} {...tooltipProps} />
      )}
    </SplitStateButton>
  );
};
