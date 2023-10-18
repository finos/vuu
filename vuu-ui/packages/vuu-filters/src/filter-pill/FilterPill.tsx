import { MenuActionHandler } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { EditableLabel, EditableLabelProps } from "@finos/vuu-ui-controls";
import { filterAsQuery, isMultiClauseFilter } from "@finos/vuu-utils";
import cx from "classnames";
import { PopupCloseCallback } from "@finos/vuu-popups/src";
import { HTMLAttributes, useCallback, useRef } from "react";
import { FilterPillMenu } from "../filter-pill-menu";
import { filterClauses } from "../filter-utils";

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
  editable = true,
  filter,
  className: classNameProp,
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

  const handleMenuClose = useCallback<PopupCloseCallback>((reason) => {
    if (reason?.type === "escape") {
      requestAnimationFrame(() => {
        if (rootRef.current) {
          rootRef.current.focus();
        }
      });
    }
  }, []);

  return (
    <div
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
    </div>
  );
};
