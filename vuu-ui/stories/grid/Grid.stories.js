import React, { useMemo, useRef, useState } from 'react';

import { Grid } from '@vuu-ui/data-grid';
import { RemoteDataSource } from '@vuu-ui/data-remote';

import { instrumentSchema, instrumentSchemaFixed, instrumentSchemaHeaders } from './columnMetaData';

import { ParsedInput, ParserProvider } from '@vuu-ui/parsed-input';

import { parseFilter, extractFilter } from '@vuu-ui/datagrid-parsers';
import suggestionFactory from './filter-suggestion-factory';

import '@vuu-ui/theme/index.css';
import '@vuu-ui/layout/index.css';
import '@vuu-ui/ui-controls/index.css';
import '@vuu-ui/data-grid/index.css';

import './Grid.stories.css';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Grid/Default',
  component: Grid
};

export const EmptyGrid = () => <Grid />;

export const BasicGrid = () => {
  const gridRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(18);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchema.columns.map((col) => col.name),
      tableName: 'instruments',
      configUrl: '/tables/instruments/config.js'
    }),
    []
  );

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), [dataConfig]);

  const incrementProp = () => {
    setRowHeight((value) => value + 1);
  };

  const decrementProp = () => {
    setRowHeight((value) => value - 1);
  };

  const incrementCssProperty = () => {
    const rowHeight = parseInt(
      getComputedStyle(gridRef.current).getPropertyValue('--hw-grid-row-height')
    );
    gridRef.current.style.setProperty('--grid-row-height', `${rowHeight + 1}px`);
  };

  const decrementCssProperty = () => {
    const rowHeight = parseInt(
      getComputedStyle(gridRef.current).getPropertyValue('--hw-grid-row-height')
    );
    gridRef.current.style.setProperty('--grid-row-height', `${rowHeight - 1}px`);
  };

  const setLowDensity = () => {
    gridRef.current.style.setProperty('--grid-row-height', `32px`);
  };
  const setHighDensity = () => {
    gridRef.current.style.setProperty('--grid-row-height', `20px`);
  };

  const gridStyles = `
    .StoryGrid {
      --hwDataGridCell-border-style: none;
      --hwDataGridRow-background-odd: var(--surface1);
      --hwDataGrid-font-size: 10px;
    }
  `;

  return (
    <>
      <style>{gridStyles}</style>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        // cellSelectionModel="single-cell"
        className="StoryGrid"
        dataSource={dataSource}
        columns={instrumentSchema.columns}
        columnSizing="fill"
        height={624}
        ref={gridRef}
        renderBufferSize={50}
        rowHeight={rowHeight}
        selectionModel="single"
        style={{ margin: 10, border: 'solid 1px #ccc' }}
      />
      <br />
      <button onClick={incrementProp}>Increase row height prop</button>
      <button onClick={decrementProp}>Decrease row height prop</button>
      <button onClick={incrementCssProperty}>Increase row height custom property</button>
      <button onClick={decrementCssProperty}>Decrease row height custom property</button>
      <br />
      <button onClick={setHighDensity}>High Density</button>
      <button onClick={setLowDensity}>Low Density</button>
    </>
  );
};

// export const BasicGridColumnLabels = () => {
//   const gridRef = useRef(null)

//   const dataConfig = useMemo(() => ({
//     bufferSize: 100,
//     columns: instrumentSchemaLabels.columns.map(col => col.name),
//     tableName: 'instruments',
//     configUrl: '/tables/instruments/config.js',
//   }),[]);

//   const dataSource = useMemo(() => new RemoteDataSource(dataConfig), [dataConfig]);

//   return <>
//     <div>
//       <input defaultValue="Life is" />
//     </div>
//     <Grid
//       dataSource={dataSource}
//       columns={instrumentSchemaLabels.columns}
//       height={600}
//       ref={gridRef}
//       renderBufferSize={20}
//       style={{ margin: 10, border: 'solid 1px #ccc' }}
//     />
//   </>;
// };

export const BasicGridColumnFixedCols = () => {
  const gridRef = useRef(null);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchemaFixed.columns.map((col) => col.name),
      tableName: 'instruments',
      configUrl: '/tables/instruments/config.js'
    }),
    []
  );

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), [dataConfig]);

  return (
    <>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        dataSource={dataSource}
        columns={instrumentSchemaFixed.columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: 'solid 1px #ccc' }}
      />
    </>
  );
};

export const BasicGridColumnHeaders = () => {
  const gridRef = useRef(null);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchema.columns.map((col) => col.name),
      tableName: 'instruments',
      configUrl: '/tables/instruments/config.js'
    }),
    []
  );

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), [dataConfig]);

  return (
    <>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        dataSource={dataSource}
        columns={instrumentSchemaHeaders.columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: 'solid 1px #ccc' }}
      />
    </>
  );
};

export const BasicGridWithFilter = () => {
  const gridRef = useRef(null);
  const [namedFilters, setNamedFilters] = useState([]);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchema.columns.map((col) => col.name),
      tableName: 'instruments',
      configUrl: '/tables/instruments/config.js'
    }),
    []
  );

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), [dataConfig]);

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    dataSource.filterQuery(filter);
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  return (
    <>
      <ParserProvider
        parser={parseFilter}
        suggestionFactory={suggestionFactory({
          columnNames: dataConfig.columns,
          namedFilters
        })}>
        <div style={{ width: 600 }}>
          <ParsedInput onCommit={handleCommit} />
        </div>
      </ParserProvider>
      <Grid
        dataSource={dataSource}
        columns={instrumentSchema.columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: 'solid 1px #ccc' }}
      />
    </>
  );
};
