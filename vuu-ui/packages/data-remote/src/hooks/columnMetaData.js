export const columnMetaData = {
  account: {
    label: 'Account',
    name: 'account',
    type: {
      name: 'string'
    }
  },
  algo: {
    label: 'Algo',
    name: 'algo',
    type: {
      name: 'string'
    }
  },
  ask: {
    name: 'ask',
    label: 'Ask',
    type: {
      name: 'number',
      renderer: { name: 'background', flashStyle: 'arrow-bg' },
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  askSize: {
    name: 'askSize',
    label: 'Ask Size',
    type: {
      name: 'number'
    },
    aggregate: 'avg'
  },
  averagePrice: {
    label: 'Average Price',
    name: 'averagePrice',
    type: {
      name: 'number'
    },
    aggregate: 'avg'
  },
  bbg: {
    name: 'bbg',
    label: 'BBG',
    type: {
      name: 'string'
    }
  },
  bid: {
    label: 'Bid',
    name: 'bid',
    type: {
      name: 'number',
      renderer: { name: 'background', flashStyle: 'arrow-bg' },
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  bidSize: {
    label: 'Bid Size',
    name: 'bidSize',
    type: {
      name: 'number'
    },
    aggregate: 'avg'
  },
  ccy: {
    name: 'ccy',
    label: 'CCY',
    width: 60
  },
  childCount: {
    label: 'Child Count',
    name: 'childCount',
    type: {
      name: 'number'
    },
    aggregate: 'avg'
  },

  close: {
    label: 'Close',
    name: 'close',
    type: {
      name: 'number',
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  clOrderId: {
    label: 'Child Order ID',
    name: 'clOrderId',
    width: 60
  },
  created: {
    label: 'Created',
    name: 'created',
    type: {
      name: 'timestamp'
    }
  },
  currency: {
    name: 'currency',
    label: 'CCY',
    width: 60
  },
  description: {
    name: 'description',
    label: 'Description',
    type: {
      name: 'string'
    }
  },
  exchange: {
    name: 'exchange',
    label: 'Exchange',
    type: {
      name: 'string'
    }
  },
  filledQty: {
    label: 'Filled Qty',
    name: 'filledQty',
    width: 80,
    type: {
      name: 'number',
      renderer: { name: 'progress', associatedField: 'quantity' },
      format: { decimals: 0 }
    }
  },
  filledQuantity: {
    label: 'Filled Qty',
    name: 'filledQuantity',
    width: 80,
    type: {
      name: 'number',
      renderer: { name: 'progress', associatedField: 'quantity' },
      format: { decimals: 0 }
    }
  },
  id: {
    name: 'id',
    label: 'ID',
    type: {
      name: 'string'
    }
  },
  idAsInt: {
    label: 'ID (int)',
    name: 'idAsInt',
    type: {
      name: 'string'
    }
  },
  isin: {
    name: 'isin',
    label: 'ISIN',
    type: {
      name: 'string'
    }
  },
  last: {
    label: 'Last',
    name: 'last',
    type: {
      name: 'number',
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  lastUpdate: {
    label: 'Last Update',
    name: 'lastUpdate',
    type: {
      name: 'timestamp'
    }
  },
  lotSize: {
    label: 'Lot Size',
    name: 'lotSize',
    width: 80,
    type: {
      name: 'number'
    }
  },
  max: {
    label: 'Max',
    name: 'max',
    width: 80,
    type: {
      name: 'number'
    }
  },
  mean: {
    label: 'Mean',
    name: 'mean',
    width: 80,
    type: {
      name: 'number'
    }
  },
  open: {
    label: 'Open',
    name: 'open',
    type: {
      name: 'number',
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  openQty: {
    label: 'Open Qty',
    name: 'openQuantity',
    width: 80,
    type: {
      name: 'number',
      format: { decimals: 0 }
    }
  },
  orderId: {
    label: 'Order ID',
    name: 'orderId',
    width: 60
  },

  phase: {
    label: 'Phase',
    name: 'phase',
    type: {
      name: 'string'
    }
  },
  parentOrderId: {
    label: 'Parent Order Id',
    name: 'parentOrderId',
    width: 80,
    type: {
      name: 'number'
    }
  },
  orderType: {
    label: 'Order Type',
    name: 'orderType',
    type: {
      name: 'string'
    }
  },
  price: {
    label: 'Price',
    name: 'price',
    type: {
      name: 'number',
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  priceLevel: {
    label: 'Price Level',
    name: 'priceLevel',
    type: {
      name: 'string'
    }
  },
  quantity: {
    label: 'Quantity',
    name: 'quantity',
    width: 80,
    type: {
      name: 'number'
    }
  },
  ric: {
    name: 'ric',
    label: 'RIC',
    type: {
      name: 'string'
    }
  },
  scenario: {
    label: 'Scenario',
    name: 'scenario',
    type: {
      name: 'string'
    }
  },
  side: {
    label: 'Side',
    name: 'side',
    type: {
      name: 'string'
    }
  },
  size: {
    label: 'Size',
    name: 'size',
    width: 80,
    type: {
      name: 'number'
    }
  },
  status: {
    label: 'Status',
    name: 'status',
    type: {
      name: 'string'
    }
  },
  strategy: {
    label: 'Strategy',
    name: 'strategy',
    type: {
      name: 'string'
    }
  },
  table: {
    label: 'Table',
    name: 'table',
    type: {
      name: 'string'
    }
  },
  trader: {
    label: 'Trader',
    name: 'trader',
    type: {
      name: 'string'
    }
  },
  uniqueId: {
    label: 'Unique ID',
    name: 'uniqueId',
    type: {
      name: 'string'
    }
  },
  updateCount: {
    label: 'Update Count',
    name: 'updateCount',
    width: 80,
    type: {
      name: 'number'
    }
  },
  updatesPerSecond: {
    label: 'Updates Per Second',
    name: 'updatesPerSecond',
    width: 80,
    type: {
      name: 'number'
    }
  },
  user: {
    label: 'User',
    name: 'user',
    type: {
      name: 'string'
    }
  },
  volLimit: {
    label: 'Vol Limit',
    name: 'volLimit',
    width: 80,
    type: {
      name: 'number'
    }
  }
};
