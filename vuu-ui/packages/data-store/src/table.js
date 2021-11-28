import { EventEmitter } from '@vuu-ui/utils/src/event-emitter';

const defaultUpdateConfig = {
  applyUpdates: false,
  applyInserts: false,
  interval: 500
};

function buildColumnMap(columns) {
  if (columns) {
    const map = { IDX: 0, KEY: 1 };
    for (let i = 0; i < columns.length; i++) {
      map[columns[i].name] = i + 2;
    }
    return map;
  } else {
    return null;
  }
}

export default class Table extends EventEmitter {
  constructor(config) {
    super();
    const { name, columns = null, primaryKey, dataPath, data, updates = {} } = config;
    this.name = name;
    this.primaryKey = primaryKey;
    this.columns = columns;
    this.keys = {};
    this.index = {};
    this.indices = [];
    this.rows = [];
    this.updateConfig = {
      ...defaultUpdateConfig,
      ...updates
    };
    this.inputColumnMap = undefined;
    this.columnMap = buildColumnMap(columns);
    this.columnCount = 0;
    this.status = null;

    if (data) {
      this.load(data);
    } else if (dataPath) {
      this.fetchData(dataPath);
    }

    this.installDataGenerators(config);
  }

  update(rowIdx, ...updates) {
    const results = [];
    let row = this.rows[rowIdx];
    for (let i = 0; i < updates.length; i += 2) {
      const colIdx = updates[i];
      const value = updates[i + 1];
      results.push(colIdx, row[colIdx], value);
      row[colIdx] = value;
    }
    this.emit('rowUpdated', rowIdx, results);
  }

  bulkUpdate(updates, doNotPublish) {
    const results = [];
    for (let rowUpdate of updates) {
      const [idx] = rowUpdate;
      const row = this.rows[idx];
      const rowResult = [idx];
      for (let i = 1; i < rowUpdate.length; i += 2) {
        const colIdx = rowUpdate[i];
        const value = rowUpdate[i + 1];
        rowResult.push(colIdx, row[colIdx], value);
        row[colIdx] = value;
      }
      results.push(rowResult);
    }
    this.emit('rowsUpdated', results, doNotPublish);
  }

  // Don't think this is worth the overhead
  // bulkUpdate(updates){
  // const map = new Map();
  // const results = [];
  // let rowResult;
  // for (let rowUpdate of updates){
  //     const [idx] = rowUpdate;
  //     const row = this.rows[idx];

  //     if (map.has(idx)){
  //         rowResult = map.get(idx);
  //     } else {
  //         results.push(rowResult = [idx]);
  //         map.set(idx, rowResult)
  //     }

  //     for (let i=1;i<rowUpdate.length;i+=2){
  //         const colIdx = rowUpdate[i];
  //         const value = rowUpdate[i+1];
  //         const pos = rowResult.indexOf(colIdx);
  //         if (pos === -1 || (pos-1)%3){ // don't mistake a value for a column Index
  //             rowResult.push(colIdx, row[colIdx], value);
  //         } else {
  //             // updates are in sequence so later update for same column replaces earlier value
  //             rowResult.splice(pos+1, 2, row[colIdx], value);
  //         }
  //         row[colIdx] = value;
  //     }
  // }
  // console.log(results)
  // this.emit('rowsUpdated', results);
  // }

  insert(data) {
    let columnnameList = this.columns ? this.columns.map((c) => c.name) : null;
    const idx = this.rows.length;
    let row = this.rowFromData(idx, data, columnnameList);
    this.rows.push(row);
    this.emit('rowInserted', idx, row);
  }

  remove(key) {
    if (this.keys[key]) {
      const index = this.indices[key];
      delete this.keys[key];
      delete this.indices[key];
      this.rows.splice(index, 1);

      for (let k in this.indices) {
        if (this.indices[k] > index) {
          this.indices[k] -= 1;
        }
      }

      this.emit('rowRemoved', this.name, key);
    }
  }

  clear() {}

  toString() {
    const out = ['\n' + this.name];
    out.splice.apply(
      out,
      [1, 0].concat(
        this.rows.map(function (row) {
          return row.toString();
        })
      )
    );
    return out.join('\n');
  }

  async fetchData(url) {
    fetch(url, {})
      .then((data) => data.json())
      .then((json) => {
        console.log(`Table.loadData: got ${json.length} rows`);
        this.load(json);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  load(data) {
    let columnnameList = this.columns ? this.columns.map((c) => c.name) : null;
    const rows = [];
    for (let i = 0; i < data.length; i++) {
      let row = this.rowFromData(i, data[i], columnnameList);
      rows.push(row);
    }
    this.rows = rows;

    if (this.columns === null) {
      this.columns = columnsFromColumnMap(this.inputColumnMap);
      this.columnMap = buildColumnMap(this.columns);
    }
    this.status = 'ready';
    this.emit('ready');
    if (this.updateConfig && this.updateConfig.applyUpdates !== false) {
      setTimeout(() => {
        this.applyUpdates();
      }, 1000);
    }
    // move this
    if (this.updateConfig && this.updateConfig.applyInserts !== false) {
      setTimeout(() => {
        this.applyInserts();
      }, 10000);
    }
  }

  // Build a row [idx, primaryKey, ...data values]
  rowFromData(idx, data, columnnameList) {
    // 2 metadata items for each row, the idx and unique key
    const { index, primaryKey = null, columnMap: map } = this;

    if (Array.isArray(data)) {
      const key = data[map[this.primaryKey] - 2];
      index[key] = idx;
      return [idx, key, ...data];
    } else {
      // This allows us to load data from objects as rows, without predefined columns, where
      // not every row may have every column. How would we handle primary key ?
      const columnMap = map || (this.columnMap = { IDX: 0, KEY: 1 });
      const colnames = columnnameList || Object.getOwnPropertyNames(data);
      // why start with idx in 0 ?
      const row = [idx];
      let colIdx;

      for (let i = 0; i < colnames.length; i++) {
        const name = colnames[i];
        const value = data[name];
        if ((colIdx = columnMap[name]) === undefined) {
          colIdx = columnMap[name] = 2 + this.columnCount++;
        }
        row[colIdx] = value;
        // If we don't know the primary key, assume it is the first column for now
        if (name === primaryKey || (primaryKey === null && i === 0)) {
          index[value] = idx;
          row[map.KEY] = value;
        }
      }
      return row;
    }
  }

  //TODO move all these methods into an external helper
  applyInserts() {
    const idx = this.rows.length;
    const newRow = this.createRow(idx);
    if (newRow) {
      this.insert(newRow);
    } else {
      console.log(`createRow did not return a new row`);
    }

    setTimeout(() => this.applyInserts(), this.updateConfig.insertInterval | 100);
  }

  applyUpdates() {
    const { rows, columnMap } = this;
    // const count = Math.round(rows.length / 50);
    const count = 100;

    for (let i = 0; i < count; i++) {
      const rowIdx = getRandomInt(rows.length - 1);
      const update = this.updateRow(rowIdx, rows[rowIdx], columnMap);
      if (update) {
        this.update(rowIdx, ...update);
      }
    }

    setTimeout(() => this.applyUpdates(), this.updateConfig.interval);
  }

  createRow(idx) {
    console.warn(`createRow ${idx} must be implemented as a plugin`);
    return null;
  }

  updateRow() {
    return null;
  }

  async installDataGenerators() {
    //console.warn(`installDataGenerators must be implemented by a more specific subclass`);
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function columnsFromColumnMap(columnMap) {
  const columnNames = Object.getOwnPropertyNames(columnMap);

  return columnNames
    .map((name) => ({ name, key: columnMap[name] }))
    .sort(byKey)
    .map(({ name }) => ({ name }));
}

function byKey(col1, col2) {
  return col1.key - col2.key;
}
