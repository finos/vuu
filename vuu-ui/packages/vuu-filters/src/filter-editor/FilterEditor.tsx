import type { Filter } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { SplitButton } from "@vuu-ui/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, ReactElement } from "react";
import { FilterClauseModel } from "../FilterModel";
import { FilterClause } from "../filter-clause";
import { FilterClauseCombinator } from "./FilterClauseCombinator";
import { useFilterEditor } from "./useFilterEditor";

import filterEditorCss from "./FilterEditor.css";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

const classBase = "vuuFilterEditor";

export type FilterEditSaveHandler = (filter: Filter) => void;
export type FilterEditCancelHandler = (filter?: Filter) => void;

export interface FilterEditorProps extends HTMLAttributes<HTMLDivElement> {
  columnDescriptors: ColumnDescriptor[];
  filter?: Filter;
  onCancel: FilterEditCancelHandler;
  onSave: FilterEditSaveHandler;
  vuuTable: VuuTable;
}

export const FilterEditor = ({
  columnDescriptors,
  filter,
  onCancel,
  onSave,
  vuuTable,
  ...htmlAttributes
}: FilterEditorProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-editor",
    css: filterEditorCss,
    window: targetWindow,
  });

  const {
    columnsByName,
    filterModel,
    focusSaveButton,
    setContainer,
    onCancelFilterClause,
    onCancelFilterEdit,
    onChangeFilterCombinator,
    onKeyDownCombinator,
    saveButtonRef,
    saveButtonProps,
  } = useFilterEditor({
    columnDescriptors,
    filter,
    onCancel,
    onSave,
  });

  const getContents = () => {
    const { op } = filterModel;

    const content: ReactElement[] = [];
    filterModel.filterClauses.forEach((filterClauseModel, i) => {
      if (i > 0 && op) {
        content.push(
          <FilterClauseCombinator
            key={`filter-operator-${i}`}
            onChange={onChangeFilterCombinator}
            onKeyDown={onKeyDownCombinator}
            operator={op}
          />,
        );
      }
      content.push(
        <FilterClause
          columnsByName={columnsByName}
          data-index={i}
          filterClauseModel={filterClauseModel as FilterClauseModel}
          key={`editor-${i}`}
          onCancel={onCancelFilterClause}
          onFocusSave={focusSaveButton}
          vuuTable={vuuTable}
        />,
      );
    });
    return content;
  };

  return (
    <div {...htmlAttributes} className={classBase} ref={setContainer}>
      {getContents()}
      <SplitButton
        {...saveButtonProps}
        disabled={!filterModel.isValid}
        key="save-button"
        ref={saveButtonRef}
      >
        Save
      </SplitButton>
      <Button onClick={onCancelFilterEdit} variant="secondary">
        Cancel
      </Button>
    </div>
  );
};
