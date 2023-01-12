export const createTableRows = (viewPortId, from, to, vpSize = 100, ts = 1) => {
  const results = [];
  for (let rowIndex = from; rowIndex < to; rowIndex++) {
    const key = ("0" + rowIndex).slice(-2);
    const rowKey = `key-${key}`;
    results.push({
      viewPortId,
      vpSize,
      rowIndex,
      rowKey,
      updateType: "U",
      sel: 0,
      ts,
      data: [rowKey, `name ${key}`, 1000 + rowIndex, true],
    });
  }
  return results;
};

export const createTableGroupRows = (viewPortId, groupLevels) => {
  // prettier-ignore
  return {
    requestId: '1',
    body: {
      type: 'TABLE_ROW',
      rows: [
        {
          viewPortId: 'server-vp-1',
          vpSize: 4,
          rowIndex: -1,
          rowKey: 'SIZE',
          updateType: 'SIZE',
          ts: 1,
          sel: 0,
          data: []
        },
        {
          viewPortId: 'server-vp-1',
          vpSize: 4,
          rowIndex: 0,
          rowKey: '$root|USD',
          updateType: 'U',
          ts: 1,
          sel: 0,
          data: [1, false, '$root|USD', false, 'USD', 43714, '', 'USD', '', '', '', '', '']
        },
        {
          viewPortId: 'server-vp-1',
          vpSize: 4,
          rowIndex: 1,
          rowKey: '$root|EUR',
          updateType: 'U',
          ts: 1,
          sel: 0,
          data: [1, false, '$root|EUR', false, 'EUR', 43941, '', 'EUR', '', '', '', '', '']
        },
        {
          viewPortId: 'server-vp-1',
          vpSize: 4,
          rowIndex: 2,
          rowKey: '$root|GBX',
          updateType: 'U',
          ts: 1,
          sel: 0,
          data: [1, false, '$root|GBX', false, 'GBX', 43997, '', 'GBX', '', '', '', '', '']
        },
        {
          viewPortId: 'server-vp-1',
          vpSize: 4,
          rowIndex: 3,
          rowKey: '$root|CAD',
          updateType: 'U',
          ts: 1,
          sel: 0,
          data: [1, false, '$root|CAD', false, 'CAD', 44108, '', 'CAD', '', '', '', '', '']
        }
      ]
    }
  };
};

export const updateTableRow = (
  viewPortId,
  rowIndex,
  updatedVal,
  { vpSize = 100, ts = 2 } = {}
) => {
  const key = ("0" + rowIndex).slice(-2);
  const rowKey = `key-${key}`;
  return {
    viewPortId,
    vpSize,
    rowIndex,
    rowKey,
    updateType: "U",
    sel: 0,
    ts,
    data: [rowKey, `name ${key}`, updatedVal, true],
  };
};

// prettier-ignore
export const createSubscription = ({
  bufferSize = 0,
  filterSpec = { filter: ''},
  from = 0,
  groupBy = [],
  key = '1',
  to = 10,
  sort = [],
  viewport = `client-vp-${key}`
} = {}) => [
  { bufferSize, filterSpec, groupBy, range: { from, to }, sort, table: {module: "TEST", table: 'test-table'}, viewport },
  {
    requestId: `client-vp-${key}`,
    body: {
      type: 'CREATE_VP_SUCCESS',
      viewPortId: `server-vp-${key}`,
      columns: ['col-1', 'col-2', 'col-3', 'col-4'],
      range: { from, to: to + bufferSize },
      sort: {sortDefs: sort},
      table: "test-table",
      groupBy,
      filterSpec
    }
  }
];
