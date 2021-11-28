import React, { useEffect, useRef, useState } from 'react';

import './table.css';

export default {
  title: 'Table/Table',
  component: 'table'
};

const count = 100;
const data = [];
for (let i = 0; i < count; i++) {
  data.push([
    'column 1',
    'column 2',
    'column 3',
    'column 4',
    'column 5',
    'column 6',
    'column 7',
    'column 8'
  ]);
}

export const DefaultTable = () => {
  const tbody = useRef(null);

  let top = 0;

  return (
    <div id="table-scroll" className="table-scroll">
      <table id="main-table" className="hwTable main-table">
        <thead>
          <tr>
            <th scope="col">Header 1</th>
            <th scope="col">Header 2</th>
            <th scope="col">Header 3 with longer content</th>
            <th scope="col">Header 4 text</th>
            <th scope="col">Header 5</th>
            <th scope="col">Header 6</th>
            <th scope="col">Header 7</th>
            <th scope="col">Header 8</th>
          </tr>
        </thead>
        <tbody ref={tbody}>
          {data.map((row, i) => (
            <tr
              key={i}
              // style={{ transform: `translate(0, ${top + 25 * i}px)` }}
            >
              {row.map((val, j) => (
                <td
                  key={j}
                  style={{ top: j === 0 ? i * 25 : 'auto' }}
                  // style={{ transform: `translate(${250 * j}px,0)` }}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Footer 1</th>
            <td>Footer 2</td>
            <td>Footer 3</td>
            <td>Footer 4</td>
            <td>Footer 5</td>
            <td>Footer 6</td>
            <td>Footer 7</td>
            <td>Footer 8</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
