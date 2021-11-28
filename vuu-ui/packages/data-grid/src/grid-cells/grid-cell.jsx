import React, { useContext } from 'react';
import cx from 'classnames';
import useFormatter from './use-cell-formatter';
import ComponentContext from '../component-context';

// import getInstanceCount from './use-instance-counter';
import './grid-cell.css';

const columnType = (column) =>
  !column.type ? null : typeof column.type === 'string' ? column.type : column.type.name;

// TODO we want to allow css class to be determined by value
function useGridCellClassName(column) {
  // const count = getInstanceCount(classes);
  // console.log(`instance count = ${JSON.stringify(count)}`)

  return cx(
    'GridCell',
    column.className,
    columnType(column),
    column.resizing ? 'resizing' : null,
    column.moving ? 'moving' : null
  );
}

const cellValuesAreEqual = (prev, next) => {
  return prev.column === next.column && prev.row[prev.column.key] === next.row[next.column.key];
};

// perhaps context would be more appropriate for columnMap
export const GridCell = React.memo(function GridCell({ column, columnMap, row }) {
  const components = useContext(ComponentContext);
  const [format] = useFormatter(column);
  const className = useGridCellClassName(column);

  const rendererName = column?.type?.renderer?.name ?? null;
  const Cell = rendererName && components[rendererName];

  if (Cell) {
    return <Cell className={className} column={column} columnMap={columnMap} row={row} />;
  } else {
    return (
      <div
        className={className}
        style={{ marginLeft: column.marginLeft, width: column.width }}
        tabIndex={-1}
      >
        {format(row[column.key])}
      </div>
    );
  }
}, cellValuesAreEqual);
