import { NamedFilter } from "packages/vuu-filter-types";
import { HTMLAttributes } from "react";
import cx from "classnames";
import { EditableLabel, EditableLabelProps } from "@finos/vuu-ui-controls";
import { FilterPillMenu } from "../filter-pill-menu";

import "./FilterPill.css";

const classBase = "vuuFilterPill";

export interface FilterPillProps extends HTMLAttributes<HTMLDivElement> {
  filter: NamedFilter;
}

export const FilterPill = ({
  filter,
  className: classNameProp,
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

  return (
    <div {...htmlAttributes} className={cx(classBase, classNameProp)}>
      <EditableLabel
        defaultValue={filter.name}
        onEnterEditMode={handleEnterEditMode}
        onExitEditMode={handleExitEditMode}
      />
      <FilterPillMenu />
    </div>
  );
};
