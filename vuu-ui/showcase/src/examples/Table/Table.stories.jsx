import React, { useEffect, useRef, useState } from 'react';

import './Table.css';

export default {
  title: 'Table/Table',
  component: 'table'
};

const columns = [
  { name: 'row number' },
  { name: 'column 1' },
  { name: 'column 2' },
  { name: 'column 3' },
  { name: 'column 4' },
  { name: 'column 5' },
  { name: 'column 6' },
  { name: 'column 7' },
  { name: 'column 8' },
  { name: 'column 9' },
  { name: 'column 10' }
];

const count = 100;
const data = [];
for (let i = 0; i < count; i++) {
  data.push([
    `row ${i + 1}`,
    'value 1',
    'value 2',
    'value 3',
    'value 4',
    'value 5',
    'value 6',
    'value 7',
    'value 8',
    'value 9',
    'value 10'
  ]);
}

export const BetterTable = () => {
  const table = useRef();
  const handleScroll = (e) => {
    table.current.scrollLeft = e.target.scrollLeft;
    table.current.scrollTop = e.target.scrollTop;
  };

  const headerHeight = 25;
  const contentHeight = count * 25;
  const scrollContentHeight = headerHeight + contentHeight;

  return (
    <div id="scroller" onScroll={handleScroll}>
      <div
        className="scroll-content"
        style={{ position: 'absolute', width: 1600, height: scrollContentHeight }}
      />

      <div id="chartWrapper" ref={table}>
        <table id="chart">
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th key={i}>{column.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
