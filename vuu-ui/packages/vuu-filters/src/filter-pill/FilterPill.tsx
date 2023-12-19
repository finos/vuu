import { MenuActionHandler } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { PopupCloseCallback, Tooltip, useTooltip } from "@finos/vuu-popups";
import { EditableLabel, EditableLabelProps } from "@finos/vuu-ui-controls";
import { filterAsQuery, isMultiClauseFilter, useId } from "@finos/vuu-utils";
import cx from "classnames";
import { HTMLAttributes, useCallback, useRef } from "react";
import { FilterPillMenu } from "../filter-pill-menu";
import { filterClauses } from "../filter-utils";
import { filterAsReactNode } from "./filterAsReactNode";

import "./FilterPill.css";

const classBase = "vuuFilterPill";

const getFilterLabel = (filter: Filter) => {
  if (filter.name) {
    return filter.name;
  } else if (isMultiClauseFilter(filter)) {
    const [firstClause] = filterClauses(filter);
    return `${filterAsQuery(firstClause as Filter)} ${filter.op} ...`;
  } else {
    return filterAsQuery(filter);
  }
};

export interface FilterPillProps
  extends Pick<Partial<EditableLabelProps>, "onExitEditMode">,
    HTMLAttributes<HTMLDivElement> {
  editable?: boolean;
  filter: Filter;
  index?: number;
  onBeginEdit?: (filter: Filter) => void;
  onMenuAction?: MenuActionHandler;
  showMenu?: boolean;
}

export const FilterPill = ({
  className: classNameProp,
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

  const label = getFilterLabel(filter);
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
    tooltipContent: filterAsReactNode(filter),
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
      {tooltipProps ? (
        <Tooltip
          {...tooltipProps}
          // style={
          //   {
          //     "--vuuTooltip-background": tooltipBackground.current,
          //   } as CSSProperties
          // }
        />
      ) : null}
    </div>
  );
};
