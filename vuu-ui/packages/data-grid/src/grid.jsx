import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { ContextMenuProvider } from '@vuu-ui/ui-controls';
import { useForkRef } from '@vuu-ui/react-utils';
import cx from 'classnames';
import { GridProvider } from './grid-context';
import { buildContextMenuDescriptors, useContextMenu } from './context-menu';
import * as Action from './context-menu/context-menu-actions';
import { RowHeightCanary } from './row-height-canary';
import { ComponentProvider } from './component-context';
import { useGridModel } from './grid-model/use-grid-model';
import useDataSourceModelBindings from './use-datasource-model-bindings';
import {
  useGridActions,
  useKeyboardNavigation,
  useScrollInducedLayoutShift,
  useSelection
} from './grid-hooks';
import Viewport from './viewport';
import { measureColumns } from './grid-model/grid-model-utils';
import components from './standard-renderers';

import { Footer, Header, InlineHeader } from './grid-adornments';

import './grid.css';
// TODO use a null datasource and empty columns defs
// display a warning if loaded with no dataSource

const noop = () => undefined;

const baseClass = 'hwDataGrid';

/** @type {GridBase} */
const Grid = forwardRef(function Grid(props, ref) {
  const viewportRef = useRef(null);
  const [columnDragData, setColumnDragData] = useState(null);
  const { className, onConfigChange = noop, onRowClick } = props;
  const [rootRef, gridModel, dataSource, dispatchGridModelAction, custom] = useGridModel(props);

  const onChangeCallDatasourceSelect = useCallback(
    (selected) => {
      dataSource.select(selected);
    },
    [dataSource]
  );

  const handleSelectionChange = useSelection({
    onChange: onChangeCallDatasourceSelect,
    selection: gridModel.selectionModel
  });

  const invokeScrollAction = useScrollInducedLayoutShift({
    gridModel,
    rootRef,
    viewportRef
  });

  const invokeDataSourceAction = useCallback(
    (operation) => {
      switch (operation.type) {
        case 'openTreeNode':
          return dataSource.openTreeNode(operation.key);
        case 'closeTreeNode':
          return dataSource.closeTreeNode(operation.key);
        case 'group':
          return dataSource.group(operation.key);
        case Action.Sort:
          return dataSource.sort(operation.columns);
        default:
          console.log(`[GridBase] dataSourceOperation: unknown operation ${operation.type}`);
      }
    },
    [dataSource]
  );

  const dispatchGridAction = useGridActions({
    invokeDataSourceAction,
    handleSelectionChange,
    invokeScrollAction
  });

  const handleContextMenuAction = useContextMenu({
    dataSource,
    gridModel,
    dispatchGridModelAction
  });

  useDataSourceModelBindings(dataSource, gridModel);
  const handleChangeRange = useKeyboardNavigation(rootRef, gridModel);

  const handleColumnDragStart = useCallback(
    (phase, ...args) => {
      const [columnGroupIdx, column, columnPosition, mousePosition] = args;
      const { left } = rootRef.current.getBoundingClientRect();
      const columnGroup = gridModel.columnGroups[columnGroupIdx];
      invokeScrollAction({ type: 'scroll-start-horizontal' });
      setColumnDragData({
        column,
        columnGroupIdx,
        columnIdx: columnGroup.columns.findIndex((col) => col.key === column.key),
        initialColumnPosition: columnPosition - left,
        columnPositions: measureColumns(gridModel, left),
        mousePosition
      });
    },
    [gridModel, invokeScrollAction, rootRef]
  );
  const handleColumnDrop = useCallback(
    (phase, ...args) => {
      const [column, insertIdx] = args;
      setColumnDragData(null);
      // TODO we need the final scrollLeft here
      invokeScrollAction({ type: 'scroll-end-horizontal' });
      dispatchGridModelAction({ type: 'add-col', column, insertIdx });
    },
    [dispatchGridModelAction, invokeScrollAction]
  );

  const { assignedWidth, assignedHeight, width, height, totalHeaderHeight } = gridModel;
  const style = {
    ...props.style,
    width: assignedWidth,
    height: assignedHeight,
    paddingTop: totalHeaderHeight,
    '--grid-row-height': `${gridModel.rowHeight}px`
  };

  const gridContextData = useMemo(
    () => ({
      custom,
      dataSource,
      dispatchGridAction,
      dispatchGridModelAction,
      gridModel
    }),
    [custom, dataSource, dispatchGridAction, dispatchGridModelAction, gridModel]
  );

  return (
    // Question, how much overhead are we introducing be adding gridModel to GridContext ? Perhaps it belongs in it's own context
    <GridProvider value={gridContextData}>
      <ContextMenuProvider
        label="Grid"
        menuActionHandler={handleContextMenuAction}
        menuBuilder={buildContextMenuDescriptors(gridModel)}>
        <ComponentProvider components={components}>
          <div
            className={cx(baseClass, className)}
            ref={useForkRef(ref, rootRef)}
            role="grid"
            style={style}
            tabIndex={0}>
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

Grid.displayName = 'Grid';

export default Grid;
