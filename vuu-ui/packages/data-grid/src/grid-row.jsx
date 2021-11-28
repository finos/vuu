import React, { memo, useCallback } from 'react';
import cx from 'classnames';
import { metadataKeys } from '@vuu-ui/utils';
import { GridCell, GroupCell } from './grid-cells';

import './grid-row.css';

const classBase = 'hwDataGridRow';

const { KEY, SELECTED, IS_LEAF, IS_EXPANDED } = metadataKeys;

const Row = memo(function Row({ columnMap, columns, height, idx, row, onClick, toggleStrategy }) {
  const { [IS_LEAF]: isLeaf, [IS_EXPANDED]: expanded } = row;
  const isEmptyRow = row[KEY] === undefined;
  const isGroup = !isEmptyRow && !isLeaf;

  const className = cx(classBase, {
    group: isGroup,
    collapsed: !isLeaf && !expanded,
    expanded,
    empty: isEmptyRow,
    [`${classBase}-even`]: idx % 2 === 0
  });

  // better - make a single call to useGridCellComponent here, with columns

  const handleClick = useCallback(
    (e) => {
      const rangeSelect = e.shiftKey;
      const keepExistingSelection = e.ctrlKey || e.metaKey; /* mac only */
      onClick(idx, row, rangeSelect, keepExistingSelection);
    },
    [idx, onClick, row]
  );

  return (
    <div
      aria-selected={row[SELECTED] === 1 || undefined}
      data-idx={idx}
      className={className}
      onClick={handleClick}
      style={{
        transform: `translate3d(0px, ${idx * height}px, 0px)`
      }}>
      {columns.map((column) =>
        column.isGroup ? (
          <GroupCell column={column} key={column.key} row={row} toggleStrategy={toggleStrategy} />
        ) : (
          <GridCell key={column.key} column={column} columnMap={columnMap} row={row} />
        )
      )}
    </div>
  );
});

export default Row;
