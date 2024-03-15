import { TableSchema } from "@finos/vuu-data-types";
import { Filter } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { HTMLAttributes, useCallback } from "react";
import { FilterClause, FilterClauseProps } from "../filter-clause/FilterClause";
import { FilterClauseModel, FilterModel } from "../FilterModel";
import {
  FilterClauseCombinator,
  FilterClauseCombinatorChangeHandler,
} from "./FilterClauseCombinator";
import { FilterSaveButton } from "./FilterSaveButton";
import { useFilterEditor } from "./useFilterEditor";

import "./FilterEditor.css";

const classBase = "vuuFilterEditor";

export type FilterEditSaveHandler = (filter: Filter) => void;
export type FilterEditCancelHandler = () => void;

export interface FilterEditorProps extends HTMLAttributes<HTMLDivElement> {
  FilterClauseEditorProps?: Partial<FilterClauseProps>;
  columnDescriptors: ColumnDescriptor[];
  filterModel: FilterModel;
  onCancel: FilterEditCancelHandler;
  onSave: FilterEditSaveHandler;
  tableSchema: TableSchema;
}

export const FilterEditor = ({
  FilterClauseEditorProps,
  columnDescriptors,
  filterModel,
  onCancel,
  onSave,
  tableSchema,
  ...htmlAttributes
}: FilterEditorProps) => {
  const {
    columnsByName,
    setContainer,
    onCancelFilterClause,
    onKeyDownCombinator,
    onKeyDownMenu,
    onMenuAction,
    saveButtonRef,
  } = useFilterEditor({
    columnDescriptors,
    filterModel,
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
      <FilterSaveButton
        disabled={!filterModel.isValid}
        key="save-button"
        onFilterAction={onMenuAction}
        onKeyDown={onKeyDownMenu}
        ref={saveButtonRef}
      />
    </div>
  );
};
