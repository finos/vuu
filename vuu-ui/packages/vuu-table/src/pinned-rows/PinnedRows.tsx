import { TableProvider } from "@vuu-ui/vuu-table-extras";
import type {
  DataRow,
  GroupToggleTarget,
  RowProps,
  RuntimeColumnDescriptor,
  TableRowClickHandlerInternal,
  TableRowSelectHandler,
  TableSelectionModel,
} from "@vuu-ui/vuu-table-types";
import type { RowClassNameGenerator } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type ComponentProps,
  type FC,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getRowsInRenderOrder } from "../render-order";
import { useDataSource } from "../table-data-source/useDataSource";
import { useSelection } from "../useSelection";
import { useTableContextMenu } from "../useTableContextMenu";
import type { PinnedRowsModel } from "./usePinnedRows";

const classBase = "vuuTable";

const NO_HIGHLIGHT = { current: undefined };
const NULL_CONTAINER = { current: null };

export interface PinnedRowsProps {
  Row: FC<RowProps>;
  allowSelectCheckboxRow?: boolean;
  columns: RuntimeColumnDescriptor[];
  groupToggleTarget?: GroupToggleTarget;
  highlightedIndex?: number;
  isRowSelectable?: (dataRow: DataRow) => boolean;
  lowerCaseSearchPattern: Lowercase<string>;
  menuActionHandler: ComponentProps<typeof TableProvider>["menuActionHandler"];
  model: PinnedRowsModel;
  onSelect?: TableRowSelectHandler;
  rowActionHandlers?: ComponentProps<typeof TableProvider>["rowActionHandlers"];
  rowClassNameGenerator?: RowClassNameGenerator;
  rowHeight: number;
  selectionModel: TableSelectionModel;
  showBookends: boolean;
  virtualColSpan: number;
  zebraStripes?: boolean;
}

const noop = () => undefined;

/**
 * Renders all rows from the pinned data source, above the scrolling body
 * of the Table. Rows are not virtualised. If there are more rows than
 * maxVisibleRows, the rows are offset by scrollTop.
 */
export const PinnedRows = ({
  Row,
  allowSelectCheckboxRow,
  columns,
  groupToggleTarget,
  highlightedIndex,
  isRowSelectable,
  lowerCaseSearchPattern,
  menuActionHandler,
  model: {
    dataSource,
    headerCount,
    maxPinnedRows,
    maxVisibleRows,
    onHeightChange,
    onRowClick,
    onRowCountChange,
    onSelectionChange,
    scrollTop,
  },
  onSelect,
  rowActionHandlers,
  rowClassNameGenerator,
  rowHeight,
  selectionModel,
  showBookends,
  virtualColSpan,
  zebraStripes,
}: PinnedRowsProps) => {
  const [rowCount, setRowCount] = useState(0);

  const handleSizeChange = useCallback(
    (size: number) => {
      setRowCount(Math.min(size, maxPinnedRows));
    },
    [maxPinnedRows],
  );

  const { dataRows, dataRowsRef, getSelectedRows, setRange } = useDataSource({
    dataSource,
    onSelect: noop,
    onSizeChange: handleSizeChange,
    onSubscribed: noop,
    renderBufferSize: 0,
    selectionModel,
  });

  useEffect(() => {
    setRange({ from: 0, to: maxPinnedRows });
  }, [maxPinnedRows, setRange]);

  useEffect(() => {
    onRowCountChange(rowCount);
  }, [onRowCountChange, rowCount]);

  useEffect(
    () => () => {
      onRowCountChange(0);
      onHeightChange(0);
    },
    [onHeightChange, onRowCountChange],
  );

  const visibleRows = dataRows.filter((row) => row.index < maxPinnedRows);
  const isEmpty = rowCount === 0 || visibleRows.length === 0;

  // The pinned area is measured, rather than calculated, so the divider
  // can be sized by theme.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const containerRef = useCallback(
    (el: HTMLDivElement | null) => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (el) {
        const measure = () =>
          onHeightChange(Math.round(el.getBoundingClientRect().height));
        measure();
        resizeObserverRef.current = new ResizeObserver(measure);
        resizeObserverRef.current.observe(el);
      } else {
        onHeightChange(0);
      }
    },
    [onHeightChange],
  );

  const handleSelect = useCallback(
    (dataRow: DataRow | null) => onSelect?.(dataRow, "pinned"),
    [onSelect],
  );

  const { onRowClick: selectionHookOnRowClick } = useSelection({
    allowSelectCheckboxRow,
    containerRef: NULL_CONTAINER,
    dataSource,
    dataRowsRef,
    highlightedIndexRef: NO_HIGHLIGHT,
    isRowSelectable,
    onSelect: handleSelect,
    onSelectionChange,
    selectionModel,
  });

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (evt, dataRow, rangeSelect, keepExistingSelection) => {
      selectionHookOnRowClick?.(
        evt,
        dataRow,
        rangeSelect,
        keepExistingSelection,
      );
      onRowClick?.(evt, dataRow, rangeSelect, keepExistingSelection);
    },
    [onRowClick, selectionHookOnRowClick],
  );

  const showContextMenu = useTableContextMenu({
    columns,
    dataRows,
    dataSource,
    getSelectedRows,
    headerCount,
  });

  const handleContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      showContextMenu?.(evt);
    },
    [showContextMenu],
  );

  if (isEmpty) {
    return null;
  }

  const visibleHeight = Math.min(rowCount, maxVisibleRows) * rowHeight;

  return (
    <TableProvider
      dataSource={dataSource}
      menuActionHandler={menuActionHandler}
      rowActionHandlers={rowActionHandlers}
    >
      <div
        className={`${classBase}-pinnedRows`}
        onContextMenu={handleContextMenu}
        ref={containerRef}
        role="rowgroup"
      >
        <div
          className={`${classBase}-pinnedRowsViewport`}
          style={{ height: visibleHeight }}
        >
          {getRowsInRenderOrder(visibleRows).map(
            ({
              dataRow,
              nextDataRow,
              precedesSelection,
              previousDataRow,
              selectionEnd,
              selectionStart,
            }) => {
              const ariaRowIndex = dataRow.index + headerCount + 1;
              return (
                <Row
                  aria-rowindex={ariaRowIndex}
                  className={cx(
                    "vuuTableRow-pinned",
                    rowClassNameGenerator?.(
                      dataRow,
                      previousDataRow,
                      nextDataRow,
                    ),
                  )}
                  columns={columns}
                  data-first-row={dataRow.index === 0 ? "true" : undefined}
                  data-pinned="true"
                  data-precedes-selection={
                    precedesSelection ? "true" : undefined
                  }
                  data-selection-end={selectionEnd ? "true" : undefined}
                  data-selection-start={selectionStart ? "true" : undefined}
                  dataRow={dataRow}
                  groupToggleTarget={groupToggleTarget}
                  highlighted={highlightedIndex === ariaRowIndex}
                  isSelectable={isRowSelectable?.(dataRow)}
                  key={dataRow.renderIndex}
                  offset={dataRow.index * rowHeight - scrollTop}
                  onClick={handleRowClick}
                  searchPattern={lowerCaseSearchPattern}
                  showBookends={showBookends}
                  virtualColSpan={virtualColSpan}
                  zebraStripes={zebraStripes}
                />
              );
            },
          )}
        </div>
        <div aria-hidden className={`${classBase}-pinnedDivider`} />
      </div>
    </TableProvider>
  );
};
