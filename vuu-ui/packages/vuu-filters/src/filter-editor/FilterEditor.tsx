import { TableSchema } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { SplitButton } from "@finos/vuu-ui-controls";
import { HTMLAttributes, useCallback } from "react";
import { FilterClause, FilterClauseProps } from "../filter-clause/FilterClause";
import { FilterClauseModel } from "../FilterModel";
import {
  FilterClauseCombinator,
  FilterClauseCombinatorChangeHandler,
} from "./FilterClauseCombinator";
import { useFilterEditor } from "./useFilterEditor";

import "./FilterEditor.css";

const classBase = "vuuFilterEditor";

export type FilterEditSaveHandler = (filter: Filter) => void;
export type FilterEditCancelHandler = (filter?: Filter) => void;

export interface FilterEditorProps extends HTMLAttributes<HTMLDivElement> {
  FilterClauseEditorProps?: Partial<FilterClauseProps>;
  columnDescriptors: ColumnDescriptor[];
  filter?: Filter;
  onCancel: FilterEditCancelHandler;
  onSave: FilterEditSaveHandler;
  tableSchema: TableSchema;
}

export const FilterEditor = ({
  FilterClauseEditorProps,
  columnDescriptors,
  filter,
  onCancel,
  onSave,
  tableSchema,
  ...htmlAttributes
}: FilterEditorProps) => {
  const {
    columnsByName,
    filterModel,
    setContainer,
    onCancelFilterClause,
    onKeyDownCombinator,
    saveButtonRef,
    saveButtonProps,
  } = useFilterEditor({
    columnDescriptors,
    filter,
    onCancel,
    onSave,
  });

  const onChange = useCallback<FilterClauseCombinatorChangeHandler>((op) => {
    console.log(`change op ${op}`);
  }, []);

  const getContents = () => {
    const { op } = filterModel;

    const content: JSX.Element[] = [];
    filterModel.filterClauses.forEach((filterClauseModel, i) => {
      if (i > 0 && op) {
        content.push(
          <FilterClauseCombinator
            key={`filter-operator-${i}`}
            onChange={onChange}
            onKeyDown={onKeyDownCombinator}
            operator={op}
          />
        );
      }
      content.push(
        <FilterClause
          {...FilterClauseEditorProps}
          columnsByName={columnsByName}
          data-index={i}
          filterClauseModel={filterClauseModel as FilterClauseModel}
          key={`editor-${i}`}
          onCancel={onCancelFilterClause}
          tableSchema={tableSchema}
        />
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
    </div>
  );
};
