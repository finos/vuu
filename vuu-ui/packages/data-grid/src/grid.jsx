import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ContextMenuProvider } from "@vuu-ui/ui-controls";
import { useForkRef } from "@vuu-ui/react-utils";
import cx from "classnames";
import { GridProvider } from "./grid-context";
import { buildContextMenuDescriptors, useContextMenu } from "./context-menu";
import * as Action from "./context-menu/context-menu-actions";
import * as GridModelAction from "./grid-model/grid-model-actions";
import { RowHeightCanary } from "./row-height-canary";
import { ComponentProvider } from "./component-context";
import { useGridModel } from "./grid-model/use-grid-model";
import useDataSourceModelBindings from "./use-datasource-model-bindings";
import {
  useGridActions,
  useKeyboardNavigation,
  useScrollInducedLayoutShift,
  useSelection,
} from "./grid-hooks";
import Viewport from "./viewport";
import { measureColumns } from "./grid-model/grid-model-utils";
import components from "./standard-renderers";

import { Footer, Header, InlineHeader } from "./grid-adornments";

import "./grid.css";
// TODO use a null datasource and empty columns defs
// display a warning if loaded with no dataSource

const noop = () => undefined;
const DEFAULT_COLUMN_WIDTH = 100;
const MIN_COLUMN_WIDTH = 80;

const baseClass = "hwDataGrid";

const Grid = forwardRef(function Grid(
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
    selectionModel, // default should be none
    showLineNumbers = false,
    sort,
    style: styleProp,
    width: widthProp,
    ...htmlAttributes
  },
  ref
) {
  const viewportRef = useRef(null);
  const gridModelRef = useRef(null);
  const [columnDragData, setColumnDragData] = useState(null);
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

  const invokeScrollAction = useScrollInducedLayoutShift({
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
        case Action.Sort:
          return dataSource.sort(operation.columns);
        default:
          console.log(
            `[GridBase] dataSourceOperation: unknown operation ${operation.type}`
          );
      }
    },
    [dataSource]
  );

  const handleConfigChange = useCallback(
    ({ type }) => {
      if (onConfigChange) {
        switch (type) {
          case "columns": {
            const {
              current: { columns },
            } = gridModelRef;
            return onConfigChange({
              columns,
            });
          }
          default:
        }
      }
    },
    [onConfigChange]
  );

  const dispatchGridAction = useGridActions({
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

  useDataSourceModelBindings(dataSource, gridModel);
  const handleChangeRange = useKeyboardNavigation(rootRef, gridModel);

  const handleColumnDragStart = useCallback(
    (phase, ...args) => {
      const [columnGroupIdx, column, columnPosition, mousePosition] = args;
      const { left } = rootRef.current.getBoundingClientRect();
      const columnGroup = gridModel.columnGroups[columnGroupIdx];
      invokeScrollAction({ type: "scroll-start-horizontal" });
      setColumnDragData({
        column,
        columnGroupIdx,
        columnIdx: columnGroup.columns.findIndex(
          (col) => col.key === column.key
        ),
        initialColumnPosition: columnPosition - left,
        columnPositions: measureColumns(gridModel, left),
        mousePosition,
      });
    },
    [gridModel, invokeScrollAction, rootRef]
  );
  const handleColumnDrop = useCallback(
    (phase, ...args) => {
      const [column, insertIdx] = args;
      setColumnDragData(null);
      // TODO we need the final scrollLeft here
      invokeScrollAction({ type: "scroll-end-horizontal" });
      dispatchGridModelAction({
        type: GridModelAction.ADD_COL,
        column,
        insertIdx,
      });
      setTimeout(() => handleConfigChange({ type: "columns" }), 0);
    },
    [dispatchGridModelAction, handleConfigChange, invokeScrollAction]
  );

  const { assignedWidth, assignedHeight, width, height, totalHeaderHeight } =
    gridModel;
  const style = {
    ...styleProp,
    width: assignedWidth,
    height: assignedHeight,
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
            ref={useForkRef(ref, rootRef)}
            role="grid"
            style={style}
            tabIndex={0}
          >
            <RowHeightCanary />
            {height == null || width === null ? null : (
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
            )}
          </div>
        </ComponentProvider>
      </ContextMenuProvider>
    </GridProvider>
  );
});

Grid.Header = Header;
Grid.InlineHeader = InlineHeader;
Grid.Footer = Footer;

Grid.displayName = "Grid";

export default Grid;
