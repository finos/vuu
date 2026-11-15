import type { Filter } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { Icon, SplitButton } from "@vuu-ui/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, ReactElement } from "react";
import { FilterClause } from "../filter-clause";
import { FilterClauseCombinator } from "./FilterClauseCombinator";
import { useFilterEditor } from "./useFilterEditor";

import filterEditorCss from "./FilterEditor.css";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

const classBase = "vuuFilterEditor";

const saveButtonAriaProps = { "aria-label": "Save" };

export type FilterEditSaveHandler = (filter: Filter) => void;
export type FilterEditCancelHandler = (filter?: Filter) => void;

export interface FilterEditorProps extends HTMLAttributes<HTMLDivElement> {
  columnDescriptors: readonly ColumnDescriptor[];
  filter?: Filter;
  onCancel: FilterEditCancelHandler;
  onSave: FilterEditSaveHandler;
  /**
   * Table used in calls to the Vuu typeahead service. Without it, text
   * values are entered as free text.
   */
  vuuTable?: VuuTable;
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
            key={`filter-operator-${filterClauseModel.id}`}
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
          filterClauseModel={filterClauseModel}
          key={`editor-${filterClauseModel.id}`}
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
      {filter?.name ? (
        <span className={`${classBase}-name`}>{filter.name}</span>
      ) : null}
      {getContents()}
      <SplitButton
        {...saveButtonProps}
        ButtonProps={saveButtonAriaProps}
        className={`${classBase}-save`}
        disabled={!filterModel.isValid}
        key="save-button"
        ref={saveButtonRef}
      >
        <Icon name="tick" size={12} />
      </SplitButton>
      <Button
        appearance="transparent"
        aria-label="Cancel"
        className={`${classBase}-cancel`}
        onClick={onCancelFilterEdit}
        sentiment="neutral"
      >
        <Icon name="close" size={10} />
      </Button>
    </div>
  );
};
