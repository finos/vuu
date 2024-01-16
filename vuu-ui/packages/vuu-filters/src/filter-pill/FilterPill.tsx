import { MenuActionHandler } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { PopupCloseCallback, Tooltip, useTooltip } from "@finos/vuu-popups";
import { EditableLabel, EditableLabelProps } from "@finos/vuu-ui-controls";
import { useId } from "@finos/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback, useMemo, useRef } from "react";
import { FilterPillMenu } from "../filter-pill-menu";
import { filterAsReactNode } from "./filterAsReactNode";
import { ColumnDescriptor } from "@finos/vuu-table-types";

import "./FilterPill.css";
import { getFilterLabel } from "./getFilterLabel";

const classBase = "vuuFilterPill";

export interface FilterPillProps
  extends Pick<Partial<EditableLabelProps>, "onExitEditMode">,
    HTMLAttributes<HTMLDivElement> {
  columnDescriptors?: Record<string, ColumnDescriptor>;
  editable?: boolean;
  filter: Filter;
  index?: number;
  onBeginEdit?: (filter: Filter) => void;
  onMenuAction?: MenuActionHandler;
  showMenu?: boolean;
}

export const FilterPill = ({
  className: classNameProp,
  columnDescriptors,
  editable = true,
  filter,
  id: idProp,
  onBeginEdit,
  onExitEditMode,
  onMenuAction,
  showMenu = true,
  ...htmlAttributes
}: FilterPillProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const handleEnterEditMode: EditableLabelProps["onEnterEditMode"] =
    useCallback(() => {
      onBeginEdit?.(filter);
    }, [filter, onBeginEdit]);

  const getLabel = getFilterLabel(columnDescriptors);
  const label = useMemo(
    () => filter.name ?? getLabel(filter),
    [getLabel, filter]
  );

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

  // Experiment, to be revisited
  // const tooltipBackground = useRef<string | undefined>();
  // useLayoutEffect(() => {
  //   if (rootRef.current) {
  //     tooltipBackground.current = getComputedStyle(
  //       rootRef.current
  //     ).getPropertyValue("--vuuTooltip-background");
  //   }
  // }, []);

  const { anchorProps, tooltipProps } = useTooltip({
    id,
    placement: "below",
    tooltipContent: filterAsReactNode(filter, getLabel),
  });

  return (
    <div
      {...anchorProps}
      {...htmlAttributes}
      className={cx(classBase, classNameProp)}
      data-text={label}
      ref={rootRef}
    >
      {editable && onExitEditMode ? (
        <EditableLabel
          defaultValue={label}
          key={label}
          onEnterEditMode={handleEnterEditMode}
          onExitEditMode={onExitEditMode}
        />
      ) : (
        <span className={`${classBase}-label`}>{label}</span>
      )}
      {showMenu && onMenuAction ? (
        <FilterPillMenu
          filter={filter}
          onMenuAction={onMenuAction}
          onMenuClose={handleMenuClose}
        />
      ) : null}
      {tooltipProps && <Tooltip {...tooltipProps} />}
    </div>
  );
};
