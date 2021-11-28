export const schema = {
  childOrders: {
    table: 'childOrders',
    columns: [
      {
        name: 'account',
        serverDataType: 'string'
      },
      {
        name: 'averagePrice',
        serverDataType: 'double'
      },
      {
        name: 'ccy',
        serverDataType: 'string'
      },
      {
        name: 'exchange',
        serverDataType: 'string'
      },
      {
        name: 'filledQty',
        serverDataType: 'int'
      },
      {
        name: 'id',
        serverDataType: 'string'
      },
      {
        name: 'idAsInt',
        serverDataType: 'int'
      },
      {
        name: 'lastUpdate',
        serverDataType: 'long'
      },
      {
        name: 'openQty',
        serverDataType: 'int'
      },
      {
        name: 'parentOrderId',
        serverDataType: 'int'
      },
      {
        name: 'price',
        serverDataType: 'double'
      },
      {
        name: 'quantity',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'int'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'side',
        serverDataType: 'string'
      },
      {
        name: 'status',
        serverDataType: 'string'
      },
      {
        name: 'strategy',
        serverDataType: 'string'
      },
      {
        name: 'volLimit',
        serverDataType: 'double'
      }
    ]
  },
  instrumentPrices: {
    table: 'instrumentPrices',
    columns: [
      {
        name: 'ask',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'askSize',
        serverDataType: 'int'
      },
      {
        name: 'bbg',
        serverDataType: 'string'
      },
      {
        name: 'bid',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'bidSize',
        serverDataType: 'int'
      },
      {
        name: 'close',
        serverDataType: 'double'
      },
      {
        name: 'currency',
        label: 'ccy',
        width: 60,
        serverDataType: 'string'
      },
      {
        name: 'description',
        serverDataType: 'string'
      },
      {
        name: 'exchange',
        serverDataType: 'string'
      },
      {
        name: 'isin',
        serverDataType: 'string'
      },
      {
        name: 'last',
        serverDataType: 'double'
      },
      {
        name: 'lotSize',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'int'
      },
      {
        name: 'open',
        serverDataType: 'double'
      },
      {
        name: 'phase',
        serverDataType: 'string'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'scenario',
        serverDataType: 'string'
      }
    ]
  },
  instruments: {
    table: 'instruments',
    columns: [
      {
        name: 'bbg',
        serverDataType: 'string'
      },
      {
        name: 'currency',
        label: 'ccy',
        width: 60,
        serverDataType: 'string'
      },
      {
        name: 'description',
        serverDataType: 'string'
      },
      {
        name: 'exchange',
        serverDataType: 'string'
      },
      {
        name: 'isin',
        serverDataType: 'string'
      },
      {
        name: 'lotSize',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'int'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      }
    ]
  },
  metricsGroupBy: {
    table: 'metricsGroupBy',
    columns: [
      {
        name: '75Perc',
        serverDataType: 'long'
      },
      {
        name: '99Perc',
        serverDataType: 'long'
      },
      {
        name: '99_9Perc',
        serverDataType: 'long'
      },
      {
        name: 'id',
        serverDataType: 'string'
      },
      {
        name: 'max',
        serverDataType: 'long'
      },
      {
        name: 'mean',
        serverDataType: 'long'
      },
      {
        name: 'table',
        serverDataType: 'string'
      }
    ]
  },
  metricsTables: {
    table: 'metricsTables',
    columns: [
      {
        name: 'size',
        serverDataType: 'long'
      },
      {
        name: 'table',
        serverDataType: 'string'
      },
      {
        name: 'updateCount',
        serverDataType: 'long'
      },
      {
        name: 'updatesPerSecond',
        serverDataType: 'long'
      }
    ]
  },
  metricsViewports: {
    table: 'metricsViewports',
    columns: [
      {
        name: '75Perc',
        serverDataType: 'long'
      },
      {
        name: '99Perc',
        serverDataType: 'long'
      },
      {
        name: '99_9Perc',
        serverDataType: 'long'
      },
      {
        name: 'id',
        serverDataType: 'string'
      },
      {
        name: 'max',
        serverDataType: 'long'
      },
      {
        name: 'mean',
        serverDataType: 'long'
      },
      {
        name: 'table',
        serverDataType: 'string'
      }
    ]
  },
  orderEntry: {
    table: 'orderEntry',
    columns: [
      {
        name: 'clOrderId',
        serverDataType: 'string'
      },
      {
        name: 'orderType',
        serverDataType: 'string'
      },
      {
        name: 'price',
        serverDataType: 'double'
      },
      {
        name: 'priceLevel',
        serverDataType: 'string'
      },
      {
        name: 'quantity',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'double'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      }
    ]
  },
  orderEntryPrices: {
    table: 'orderEntryPrices',
    columns: [
      {
        name: 'ask',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'askSize',
        serverDataType: 'int'
      },
      {
        name: 'bid',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'bidSize',
        serverDataType: 'int'
      },
      {
        name: 'clOrderId',
        serverDataType: 'string'
      },
      {
        name: 'close',
        serverDataType: 'double'
      },
      {
        name: 'last',
        serverDataType: 'double'
      },
      {
        name: 'open',
        serverDataType: 'double'
      },
      {
        name: 'orderType',
        serverDataType: 'string'
      },
      {
        name: 'phase',
        serverDataType: 'string'
      },
      {
        name: 'price',
        serverDataType: 'double'
      },
      {
        name: 'priceLevel',
        serverDataType: 'string'
      },
      {
        name: 'quantity',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'double'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'scenario',
        serverDataType: 'string'
      }
    ]
  },
  orders: {
    table: 'orders',
    columns: [
      {
        name: 'ccy',
        serverDataType: 'string'
      },
      {
        name: 'created',
        serverDataType: 'long'
      },
      {
        name: 'filledQuantity',
        label: 'filled qty',
        width: 80,
        type: {
          name: 'number',
          renderer: {
            name: 'progress',
            associatedField: 'quantity'
          },
          format: {
            decimals: 0
          }
        },
        serverDataType: 'double'
      },
      {
        name: 'lastUpdate',
        serverDataType: 'long'
      },
      {
        name: 'orderId',
        serverDataType: 'string'
      },
      {
        name: 'quantity',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'double'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'side',
        serverDataType: 'char'
      },
      {
        name: 'trader',
        serverDataType: 'string'
      }
    ]
  },
  ordersPrices: {
    table: 'ordersPrices',
    columns: [
      {
        name: 'ask',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'askSize',
        serverDataType: 'int'
      },
      {
        name: 'bid',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'bidSize',
        serverDataType: 'int'
      },
      {
        name: 'ccy',
        serverDataType: 'string'
      },
      {
        name: 'close',
        serverDataType: 'double'
      },
      {
        name: 'created',
        serverDataType: 'long'
      },
      {
        name: 'filledQuantity',
        label: 'filled qty',
        width: 80,
        type: {
          name: 'number',
          renderer: {
            name: 'progress',
            associatedField: 'quantity'
          },
          format: {
            decimals: 0
          }
        },
        serverDataType: 'double'
      },
      {
        name: 'last',
        serverDataType: 'double'
      },
      {
        name: 'lastUpdate',
        serverDataType: 'long'
      },
      {
        name: 'open',
        serverDataType: 'double'
      },
      {
        name: 'orderId',
        serverDataType: 'string'
      },
      {
        name: 'phase',
        serverDataType: 'string'
      },
      {
        name: 'quantity',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'double'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'scenario',
        serverDataType: 'string'
      },
      {
        name: 'side',
        serverDataType: 'char'
      },
      {
        name: 'trader',
        serverDataType: 'string'
      }
    ]
  },
  parentOrders: {
    table: 'parentOrders',
    columns: [
      {
        name: 'account',
        serverDataType: 'string'
      },
      {
        name: 'algo',
        serverDataType: 'string'
      },
      {
        name: 'averagePrice',
        serverDataType: 'double'
      },
      {
        name: 'ccy',
        serverDataType: 'string'
      },
      {
        name: 'childCount',
        serverDataType: 'int'
      },
      {
        name: 'exchange',
        serverDataType: 'string'
      },
      {
        name: 'filledQty',
        serverDataType: 'int'
      },
      {
        name: 'id',
        serverDataType: 'string'
      },
      {
        name: 'idAsInt',
        serverDataType: 'int'
      },
      {
        name: 'lastUpdate',
        serverDataType: 'long'
      },
      {
        name: 'openQty',
        serverDataType: 'int'
      },
      {
        name: 'price',
        serverDataType: 'double'
      },
      {
        name: 'quantity',
        width: 80,
        type: {
          name: 'number'
        },
        serverDataType: 'int'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'side',
        serverDataType: 'string'
      },
      {
        name: 'status',
        serverDataType: 'string'
      },
      {
        name: 'volLimit',
        serverDataType: 'double'
      }
    ]
  },
  prices: {
    table: 'prices',
    columns: [
      {
        name: 'ask',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'askSize',
        serverDataType: 'int'
      },
      {
        name: 'bid',
        type: {
          name: 'number',
          renderer: {
            name: 'background',
            flashStyle: 'arrow-bg'
          },
          formatting: {
            decimals: 2,
            zeroPad: true
          }
        },
        aggregate: 'avg',
        serverDataType: 'double'
      },
      {
        name: 'bidSize',
        serverDataType: 'int'
      },
      {
        name: 'close',
        serverDataType: 'double'
      },
      {
        name: 'last',
        serverDataType: 'double'
      },
      {
        name: 'open',
        serverDataType: 'double'
      },
      {
        name: 'phase',
        serverDataType: 'string'
      },
      {
        name: 'ric',
        serverDataType: 'string'
      },
      {
        name: 'scenario',
        serverDataType: 'string'
      }
    ]
  },
  uiState: {
    table: 'uiState',
    columns: [
      {
        name: 'id',
        serverDataType: 'string'
      },
      {
        name: 'lastUpdate',
        serverDataType: 'long'
      },
      {
        name: 'uniqueId',
        serverDataType: 'string'
      },
      {
        name: 'user',
        serverDataType: 'string'
      }
    ]
  }
};
