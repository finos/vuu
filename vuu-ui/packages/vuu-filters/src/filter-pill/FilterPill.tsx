import { NamedFilter } from "packages/vuu-filter-types";
import { HTMLAttributes, useCallback } from "react";
import cx from "classnames";
import { EditableLabel, EditableLabelProps } from "@finos/vuu-ui-controls";
import { FilterPillMenu } from "../filter-pill-menu";

import "./FilterPill.css";
import { MenuActionHandler } from "packages/vuu-data-types";

const classBase = "vuuFilterPill";

export interface FilterPillProps extends HTMLAttributes<HTMLDivElement> {
  filter: NamedFilter;
  index?: number;
}

export const FilterPill = ({
  filter,
  className: classNameProp,
  index = 0,
  ...htmlAttributes
}: FilterPillProps) => {
  //   const handleExitEditMode: EditableLabelProps["onExitEditMode"] = (
  //     originalValue = "",
  //     editedValue = "",
  //     allowDeactivation = true
  //   ) => onExitEditMode(originalValue, editedValue, allowDeactivation, index);

  const handleEnterEditMode: EditableLabelProps["onEnterEditMode"] = () => {
    console.log("onEnterEditMode");
  };

  const handleExitEditMode: EditableLabelProps["onExitEditMode"] = (
    originalValue = "",
    editedValue = "",
    allowDeactivation = true
  ) => {
    console.log("onExitEditMode", {
      originalValue,
      editedValue,
      allowDeactivation,
    });
  };

  const handleMenuAction = useCallback<MenuActionHandler>((action) => {
    console.log(`handle action ${action.menuId}`);
    return true;
  }, []);

  return (
    <div {...htmlAttributes} className={cx(classBase, classNameProp)}>
      <EditableLabel
        defaultValue={filter.name}
        onEnterEditMode={handleEnterEditMode}
        onExitEditMode={handleExitEditMode}
      />
      <FilterPillMenu index={index} onMenuAction={handleMenuAction} />
    </div>
  );
};
