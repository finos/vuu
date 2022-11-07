export const vuuTables = [
  {
    table: 'childOrders',
    module: 'SIMUL'
  },
  {
    table: 'instrumentPrices',
    module: 'SIMUL'
  },
  {
    table: 'instruments',
    module: 'SIMUL'
  },
  {
    table: 'metricsGroupBy',
    module: 'METRICS'
  },
  {
    table: 'metricsTables',
    module: 'METRICS'
  },
  {
    table: 'metricsViewports',
    module: 'METRICS'
  },
  {
    table: 'orderEntry',
    module: 'SIMUL'
  },
  {
    table: 'orderEntryPrices',
    module: 'SIMUL'
  },
  {
    table: 'orders',
    module: 'SIMUL'
  },
  {
    table: 'ordersPrices',
    module: 'SIMUL'
  },
  {
    table: 'parentOrders',
    module: 'SIMUL'
  },
  {
    table: 'prices',
    module: 'SIMUL'
  },
  {
    table: 'uiState',
    module: 'vui'
  }
];

export const vuuTableMeta = {
  instruments: {
    columns: ['bbg', 'currency', 'description', 'exchange', 'isin', 'lotSize', 'ric'],
    dataTypes: ['string', 'string', 'string', 'string', 'string', 'int', 'string'],
    key: 'ric'
  }
};

export const testTableMeta = {
  instruments: {
    columns: ['Symbol', 'Name', 'Price', 'MarketCap', 'IPO', 'Sector', 'Industry'],
    dataTypes: ['string', 'string', 'double', 'int', 'string', 'string', 'string'],
    key: 'ric'
  }
};
