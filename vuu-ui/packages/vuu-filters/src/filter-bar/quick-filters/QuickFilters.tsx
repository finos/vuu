import {
  Button,
  FormField,
  FormFieldLabel,
  Input,
  Overlay,
  OverlayPanel,
  OverlayPanelContent,
  OverlayTrigger,
  Tooltip,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterOp,
  Filter,
} from "@vuu-ui/vuu-filter-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  Icon,
  IconButton,
  type ItemDescriptor,
  useContextPanel,
  useContextPanelAvailable,
} from "@vuu-ui/vuu-ui-controls";
import { isNumericColumn, isTemporalColumn } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type HTMLAttributes,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ContextPanelColumnsPicker,
  QuickFilterColumnsPicker,
} from "./QuickFilterColumnsPicker";
import { ColumnFilter } from "../../column-filter/ColumnFilter";
import type { FilterBarProps } from "../FilterBar";
import { useOverflowItems } from "../useOverflowItems";
import { type QuickFilterValue, useQuickFilters } from "./useQuickFilters";

import quickFiltersCss from "./QuickFilters.css";

const classBase = "vuuQuickFilters";

// suggestions are listed before anything is typed, on ArrowDown or click
const QUICK_FILTER_TYPEAHEAD_PROPS = {
  minCharacterCountToTriggerSuggestions: 0,
} as const;

export interface QuickFilterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange">,
    Partial<Pick<FilterBarProps, "onApplyFilter" | "onClearFilter">> {
  /**
   * Show the button that opens the column chooser, where the user picks
   * which columns have quick filters, and their order. Defaults to true.
   * The column chooser opens in the context panel if one is available,
   * otherwise in a popover.
   */
  allowAddColumn?: boolean;
  /**
   * Show the Search control. Defaults to true. See showFind for the columns
   * searched.
   */
  allowFind?: boolean;
  availableColumns: readonly ColumnDescriptor[];
  /**
   * The quick filter columns, in order, for an uncontrolled QuickFilters.
   * Also what Reset to default restores in the column chooser.
   */
  defaultQuickFilterColumns?: string[];
  onChangeQuickFilterColumns?: (columns: string[]) => void;
  /**
   * Called with the filter of all quick filter controls together, and how
   * many controls are set.
   */
  onQuickFilterChange?: (filter: Filter | undefined, count: number) => void;
  /**
   * The quick filter columns, in order. If provided, QuickFilters is
   * controlled.
   */
  quickFilterColumns?: string[];
  /**
   * The columns searched by the Search control: all string columns if true
   * or not provided, otherwise the named columns.
   */
  showFind?: boolean | string[];
  /**
   * Table used in calls to the Vuu typeahead service.
   */
  vuuTable?: VuuTable;
}

interface QuickFilterFieldProps {
  column: ColumnDescriptor;
  /**
   * Fields in the overflow panel do not take part in overflow measurement.
   */
  inOverflowPanel?: boolean;
  isSet: boolean;
  onChange: ColumnFilterChangeHandler;
  onClear: (column: ColumnDescriptor) => void;
  onCommit: ColumnFilterCommitHandler;
  onOperatorChange: (
    column: ColumnDescriptor,
    e: SyntheticEvent,
    op: ColumnFilterOp,
  ) => void;
  onRangeChange: ColumnFilterChangeHandler;
  overflowed?: boolean;
  value?: QuickFilterValue;
  vuuTable?: VuuTable;
}

/**
 * One column filter: the label, then the control, in one outline.
 */
const QuickFilterField = ({
  column,
  inOverflowPanel = false,
  isSet,
  onChange,
  onClear,
  onCommit,
  onOperatorChange,
  onRangeChange,
  overflowed,
  value,
  vuuTable,
}: QuickFilterFieldProps) => {
  const label = column.label ?? column.name;
  const showOperatorPicker =
    isNumericColumn(column) || isTemporalColumn(column);
  return (
    <FormField
      className={`${classBase}-filter`}
      data-field={column.name}
      data-overflow-item={!inOverflowPanel || undefined}
      data-overflowed={overflowed || undefined}
      data-set={isSet || undefined}
      labelPlacement="left"
    >
      <FormFieldLabel>{label}</FormFieldLabel>
      <div className={`${classBase}-control`}>
        <ColumnFilter
          TypeaheadProps={QUICK_FILTER_TYPEAHEAD_PROPS}
          column={column}
          onColumnFilterChange={onChange}
          onColumnRangeFilterChange={onRangeChange}
          onCommit={onCommit}
          onOperatorChange={(e, op) => onOperatorChange(column, e, op)}
          // always controlled, "=" until an operator is picked
          operator={value?.op ?? "="}
          showOperatorPicker={showOperatorPicker}
          table={vuuTable}
          value={value?.value ?? ""}
        />
        {isSet ? (
          <IconButton
            appearance="transparent"
            aria-label={`Clear ${label}`}
            className={`${classBase}-clear`}
            icon="close"
            onClick={() => onClear(column)}
            sentiment="neutral"
            size={10}
          />
        ) : null}
      </div>
    </FormField>
  );
};

export const QuickFilters = ({
  allowAddColumn = true,
  allowFind = true,
  availableColumns,
  className,
  defaultQuickFilterColumns,
  hidden,
  onApplyFilter,
  onChangeQuickFilterColumns,
  onClearFilter,
  onQuickFilterChange,
  quickFilterColumns,
  showFind,
  vuuTable,
}: QuickFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-quick-filters",
    css: quickFiltersCss,
    window: targetWindow,
  });

  const filtersRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);

  const {
    clearColumn,
    clearSearch,
    filterColumns,
    getValue,
    isSet,
    onChange,
    onChangeColumns,
    onCommit,
    onOperatorChange,
    onRangeChange,
    onResetColumns,
    onSearchChange,
    resetColumns,
    searchColumns,
    searchText,
  } = useQuickFilters({
    allowFind,
    availableColumns,
    defaultQuickFilterColumns,
    onApplyFilter,
    onChangeQuickFilterColumns,
    onClearFilter,
    onQuickFilterChange,
    quickFilterColumns,
    showFind,
  });

  const overflowedIndices = useOverflowItems({
    containerRef: filtersRef,
    measureKey: [filterColumns, hidden],
    overflowButtonRef,
  });

  const fieldProps = {
    onChange,
    onClear: clearColumn,
    onCommit,
    onOperatorChange,
    onRangeChange,
    vuuTable,
  };

  const overflowedColumns = overflowedIndices
    .map((i) => filterColumns[i])
    .filter((column): column is ColumnDescriptor => column !== undefined);
  const overflowedSetCount = overflowedColumns.filter(isSet).length;

  const allItems = useMemo<ItemDescriptor[]>(
    () => availableColumns.map(({ label, name }) => ({ label, name })),
    [availableColumns],
  );
  const selectedItems = useMemo<ItemDescriptor[]>(
    () => filterColumns.map(({ label, name }) => ({ label, name })),
    [filterColumns],
  );

  const showContextPanel = useContextPanel();
  const isContextPanelAvailable = useContextPanelAvailable();
  // context panel content is not re-rendered, so it calls the latest handler
  const changeColumnsRef = useRef(onChangeColumns);
  changeColumnsRef.current = onChangeColumns;
  const changeColumns = useCallback(
    (columns: string[]) => changeColumnsRef.current(columns),
    [],
  );
  const showColumnsInContextPanel = useCallback(() => {
    showContextPanel(
      <ContextPanelColumnsPicker
        allItems={allItems}
        defaultSelectedItems={selectedItems}
        onChangeColumns={changeColumns}
        resetColumns={resetColumns}
      />,
      "Quick filter columns",
    );
  }, [allItems, changeColumns, resetColumns, selectedItems, showContextPanel]);

  const chooseColumnsButton = (
    <IconButton
      appearance="transparent"
      aria-label="Choose quick filter columns"
      className={`${classBase}-chooseColumns`}
      icon="columns"
      onClick={isContextPanelAvailable ? showColumnsInContextPanel : undefined}
      sentiment="neutral"
      size={14}
    />
  );

  const showSearch = allowFind && searchColumns.length > 0;
  const searchedColumnNames = searchColumns
    .map(({ label, name }) => label ?? name)
    .join(", ");

  return (
    <div className={cx(classBase, className)} hidden={hidden}>
      {showSearch ? (
        <Tooltip
          content={`Searching ${searchedColumnNames}`}
          placement="bottom"
        >
          <Input
            className={`${classBase}-search`}
            data-set={searchText !== "" || undefined}
            endAdornment={
              searchText ? (
                <IconButton
                  appearance="transparent"
                  aria-label="Clear search"
                  className={`${classBase}-clear`}
                  icon="close"
                  onClick={clearSearch}
                  sentiment="neutral"
                  size={10}
                />
              ) : null
            }
            inputProps={{ "aria-label": "Search" }}
            onChange={onSearchChange}
            placeholder="Search"
            startAdornment={<Icon name="search" size={12} />}
            value={searchText}
          />
        </Tooltip>
      ) : null}
      <div className={`${classBase}-filters`} ref={filtersRef}>
        {filterColumns.map((column, i) => (
          <QuickFilterField
            {...fieldProps}
            column={column}
            isSet={isSet(column)}
            key={column.name}
            overflowed={overflowedIndices.includes(i)}
            value={getValue(column)}
          />
        ))}
      </div>
      {overflowedColumns.length > 0 ? (
        <Overlay placement="bottom-end">
          <OverlayTrigger>
            <Button
              aria-label={`${overflowedColumns.length} more quick filter${
                overflowedColumns.length === 1 ? "" : "s"
              }${overflowedSetCount > 0 ? `, ${overflowedSetCount} set` : ""}`}
              className={`${classBase}-more`}
              ref={overflowButtonRef}
              sentiment="neutral"
            >
              {overflowedSetCount > 0 ? (
                <span aria-hidden className={`${classBase}-dot`} />
              ) : null}
              {`+${overflowedColumns.length}`}
            </Button>
          </OverlayTrigger>
          <OverlayPanel className={`${classBase}-overflowPanel`}>
            <OverlayPanelContent>
              {overflowedColumns.map((column) => (
                <QuickFilterField
                  {...fieldProps}
                  column={column}
                  isSet={isSet(column)}
                  key={column.name}
                  inOverflowPanel
                  value={getValue(column)}
                />
              ))}
            </OverlayPanelContent>
          </OverlayPanel>
        </Overlay>
      ) : null}
      {allowAddColumn && isContextPanelAvailable ? chooseColumnsButton : null}
      {allowAddColumn && !isContextPanelAvailable ? (
        <Overlay placement="bottom-end">
          <OverlayTrigger>{chooseColumnsButton}</OverlayTrigger>
          <OverlayPanel
            aria-label="Quick filter columns"
            className={`${classBase}-columnsPanel`}
          >
            <OverlayPanelContent>
              <QuickFilterColumnsPicker
                allItems={allItems}
                onChangeColumns={onChangeColumns}
                onResetColumns={onResetColumns}
                selectedItems={selectedItems}
              />
            </OverlayPanelContent>
          </OverlayPanel>
        </Overlay>
      ) : null}
    </div>
  );
};
