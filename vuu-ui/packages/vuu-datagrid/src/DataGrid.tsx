import { ContextMenuProvider } from "@vuu-ui/ui-controls";
import { useForkRef } from "@heswell/uitk-core";
import cx from "classnames";
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ComponentProvider } from "./component-context";
import { buildContextMenuDescriptors, useContextMenu } from "./context-menu";
import { GridProvider } from "./grid-context";
import {
  useGridActionDispatcher,
  useKeyboardNavigation,
  useHorizonatlScrollSync,
  useSelection,
} from "./grid-hooks";
import { measureColumns, useGridModel } from "./grid-model";
import { GridModelType } from "./grid-model/gridModelTypes";
import { ColumnDragState, GridProps } from "./gridTypes";
import { RowHeightCanary } from "./RowHeightCanary";
import components from "./standard-renderers";
import { Viewport } from "./Viewport";

import { Footer, GridAdornment, Header, InlineHeader } from "./grid-adornments";

import "./DataGrid.css";
import { ConfigChangeMessage } from "@vuu-ui/vuu-data";

// TODO use a null datasource and empty columns defs
// display a warning if loaded with no dataSource

const noop = () => undefined;
const DEFAULT_COLUMN_WIDTH = 100;
const MIN_COLUMN_WIDTH = 80;

const baseClass = "vuuDataGrid";

export const Grid = forwardRef(function Grid(
  {
    aggregations,
    cellSelectionModel = "none",
    className,
    columns,
    columnSizing = "static",
    dataSource: dataSourceProp,
    defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
    filter,
    groupBy,
    headerHeight = 24,
    height: heightProp,
    minColumnWidth = MIN_COLUMN_WIDTH,
    noColumnHeaders = false,
    onConfigChange = noop,
    onRowClick,
    renderBufferSize = 0,
    rowHeight = 20,
    selectionModel = "none", // default should be none
    showLineNumbers = false,
    sort,
    style: styleProp,
    width: widthProp,
    ...htmlAttributes
  }: GridProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const viewportRef = useRef(null);
  const gridModelRef = useRef<GridModelType>();
  const [columnDragData, setColumnDragData] = useState<ColumnDragState>();
  const [rootRef, gridModel, dataSource, dispatchGridModelAction, custom] =
    useGridModel({
      aggregations,
      cellSelectionModel,
      columns,
      columnSizing,
      dataSource: dataSourceProp,
      defaultColumnWidth,
      filter,
      groupBy,
      headerHeight,
      height: heightProp,
      minColumnWidth,
      noColumnHeaders,
      renderBufferSize,
      rowHeight,
      selectionModel, // default should be none
      showLineNumbers,
      sort,
      style: styleProp,
      width: widthProp,
    });

  gridModelRef.current = gridModel;

  const onChangeCallDatasourceSelect = useCallback(
    (selected) => {
      dataSource.select(selected);
    },
    [dataSource]
  );

  const handleSelectionChange = useSelection({
    onChange: onChangeCallDatasourceSelect,
    selection: gridModel.selectionModel,
  });

  const invokeScrollAction = useHorizonatlScrollSync({
    gridModel,
    rootRef,
    viewportRef,
  });

  const invokeDataSourceAction = useCallback(
    (operation) => {
      switch (operation.type) {
        case "openTreeNode":
          return dataSource.openTreeNode(operation.key);
        case "closeTreeNode":
          return dataSource.closeTreeNode(operation.key);
        case "group":
          return dataSource.group(operation.key);
        case "sort":
          return dataSource.sort(operation.sort);
        default:
          console.log(
            `[GridBase] dataSourceOperation: unknown operation ${operation.type}`
          );
      }
    },
    [dataSource]
  );

  const handleConfigChange = useCallback(
    ({ type }: ConfigChangeMessage) => {
      if (onConfigChange && gridModelRef.current) {
        switch (type) {
          case "columns": {
            const {
              current: { columns },
            } = gridModelRef;
            return onConfigChange({
              type,
              columns,
            });
          }
          default:
        }
      }
    },
    [onConfigChange]
  );

  const dispatchGridAction = useGridActionDispatcher({
    dispatchGridModelAction,
    invokeDataSourceAction,
    handleSelectionChange,
    invokeScrollAction,
    onConfigChange: handleConfigChange,
  });

  const handleContextMenuAction = useContextMenu({
    dataSource,
    gridModel,
    dispatchGridModelAction,
  });

  // useDataSourceModelBindings(dataSource, gridModel);
  const handleChangeRange = useKeyboardNavigation(rootRef, gridModel);

  const handleColumnDragStart = useCallback(
    (phase, ...args) => {
      if (rootRef.current && gridModel) {
        const [columnGroupIdx, column, columnPosition, mousePosition] = args;
        const { left } = rootRef.current.getBoundingClientRect();
        const columnGroup = gridModel.columnGroups?.[columnGroupIdx];
        invokeScrollAction({ type: "scroll-start-horizontal" });
        const columnIdx = columnGroup?.columns.findIndex(
          (col) => col.key === column.key
        );
        if (columnIdx !== undefined && columnIdx !== -1) {
          setColumnDragData({
            column,
            columnGroupIdx,
            columnIdx,
            initialColumnPosition: columnPosition - left,
            columnPositions: measureColumns(gridModel, left),
            mousePosition,
          });
        }
      }
    },
    [gridModel, invokeScrollAction, rootRef]
  );
  const handleColumnDrop = useCallback(
    (phase, ...args) => {
      const [column, insertIdx] = args;
      setColumnDragData(undefined);
      // TODO we need the final scrollLeft here
      invokeScrollAction({ type: "scroll-end-horizontal" });
      dispatchGridModelAction({
        type: "add-col",
        column,
        insertIdx,
      });
      setTimeout(() => handleConfigChange({ type: "columns" }), 0);
    },
    [dispatchGridModelAction, handleConfigChange, invokeScrollAction]
  );

  const { width = "100%", height = "100%", totalHeaderHeight } = gridModel;
  const style = {
    ...styleProp,
    width,
    height,
    paddingTop: totalHeaderHeight,
    "--grid-row-height": `${gridModel.rowHeight}px`,
  };

  const gridContextData = useMemo(
    () => ({
      custom,
      dataSource,
      dispatchGridAction,
      dispatchGridModelAction,
      gridModel,
    }),
    [custom, dataSource, dispatchGridAction, dispatchGridModelAction, gridModel]
  );

  const readyToRender = gridModel.status === "ready";

  return (
    // Question, how much overhead are we introducing be adding gridModel to GridContext ? Perhaps it belongs in it's own context
    <GridProvider value={gridContextData}>
      <ContextMenuProvider
        label="Grid"
        menuActionHandler={handleContextMenuAction}
        menuBuilder={buildContextMenuDescriptors(gridModel)}
      >
        <ComponentProvider components={components}>
          <div
            {...htmlAttributes}
            className={cx(baseClass, className)}
            ref={useForkRef(forwardedRef, rootRef)}
            role="grid"
            style={style}
            tabIndex={0}
          >
            <RowHeightCanary />
            {readyToRender ? (
              <>
                {custom.header.component}
                <Viewport
                  custom={custom}
                  dataSource={dataSource}
                  gridModel={gridModel}
                  columnDragData={columnDragData}
                  onColumnDragStart={handleColumnDragStart}
                  onColumnDrop={handleColumnDrop}
                  onConfigChange={onConfigChange}
                  onChangeRange={handleChangeRange}
                  onRowClick={onRowClick}
                  ref={viewportRef}
                />
                {custom.footer.component}
              </>
            ) : null}
          </div>
        </ComponentProvider>
      </ContextMenuProvider>
    </GridProvider>
  );
}) as React.ForwardRefExoticComponent<GridProps> & {
  Header: GridAdornment;
  InlineHeader: GridAdornment;
  Footer: GridAdornment;
};

Grid.Header = Header;
Grid.InlineHeader = InlineHeader;
Grid.Footer = Footer;

Grid.displayName = "Grid";
