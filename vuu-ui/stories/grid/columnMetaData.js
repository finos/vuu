export const pricesColumns = [
  { name: 'ric', width: 100 },
  {
    name: 'bid',
    type: {
      name: 'number',
      renderer: { name: 'background', flashStyle: 'arrow-bg' },
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  {
    name: 'ask',
    type: {
      name: 'number',
      renderer: { name: 'background', flashStyle: 'arrow-bg' },
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  { name: 'last', type: { name: 'number' } },
  { name: 'open', type: { name: 'number' } },
  { name: 'close', type: { name: 'number' } },
  { name: 'scenario' }
];

export const orderColumns = [
  { name: 'orderId', width: 120 },
  { name: 'side', width: 100 },
  { name: 'ric', width: 100 },
  { name: 'ccy', width: 100 },
  { name: 'quantity', width: 100 },
  { name: 'filledQuantity', width: 100 },
  { name: 'trader', width: 100 },
  { name: 'lastUpdate', width: 100 }
];

export const instrumentPriceColumns = [
  { name: 'ric', width: 120 },
  { name: 'description', width: 200 },
  { name: 'currency' },
  { name: 'exchange' },
  { name: 'lotSize', type: { name: 'number' } },
  {
    name: 'bid',
    type: {
      name: 'number',
      renderer: { name: 'background', flashStyle: 'arrow-bg' },
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  {
    name: 'ask',
    type: {
      name: 'number',
      renderer: { name: 'background', flashStyle: 'arrow-bg' },
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  { name: 'last', type: { name: 'number' } },
  { name: 'open', type: { name: 'number' } },
  { name: 'close', type: { name: 'number' } },
  { name: 'scenario' }
];

export const instrumentSchema = {
  columns: [
    { name: 'Symbol', width: 120 },
    { name: 'Name', width: 200 },
    {
      name: 'Price',
      type: {
        name: 'number',
        renderer: { name: 'background', flashStyle: 'arrow-bg' },
        formatting: { decimals: 2, zeroPad: true }
      },
      aggregate: 'avg'
    },
    { name: 'MarketCap', type: 'number', aggregate: 'sum' },
    { name: 'IPO' },
    { name: 'Sector' },
    { name: 'Industry' }
  ]
};

export const instrumentSchemaFixed = {
  columns: [
    { name: 'Symbol', width: 120, locked: true },
    { name: 'Name', width: 200 },
    {
      name: 'Price',
      type: {
        name: 'number',
        renderer: { name: 'background', flashStyle: 'arrow-bg' },
        formatting: { decimals: 2, zeroPad: true }
      },
      aggregate: 'avg'
    },
    { name: 'MarketCap', type: 'number', aggregate: 'sum' },
    { name: 'IPO' },
    { name: 'Sector' },
    { name: 'Industry' }
  ]
};

export const instrumentSchemaLabels = {
  columns: [
    { name: 'Symbol', width: 120, label: 'SYM' },
    { name: 'Name', width: 200, label: 'Instrument Name' },
    {
      name: 'Price',
      type: {
        name: 'number',
        renderer: { name: 'background', flashStyle: 'arrow-bg' },
        formatting: { decimals: 2, zeroPad: true }
      },
      aggregate: 'avg'
    },
    { name: 'MarketCap', label: 'Market Cap', type: 'number', aggregate: 'sum' },
    { name: 'IPO', label: 'IPO Date' },
    { name: 'Sector' },
    { name: 'Industry' }
  ]
};

export const instrumentSchemaHeaders = {
  columns: [
    { name: 'Symbol', width: 120, heading: ['Symbol', 'Instrument'] },
    { name: 'Name', width: 200, heading: ['Name', 'Instrument'] },
    {
      name: 'Price',
      type: {
        name: 'number',
        renderer: { name: 'background', flashStyle: 'arrow-bg' },
        formatting: { decimals: 2, zeroPad: true }
      },
      aggregate: 'avg',
      heading: ['Price', 'Fundamentals']
    },
    {
      name: 'MarketCap',
      type: 'number',
      aggregate: 'sum',
      heading: ['Market Cap', 'Fundamentals']
    },
    { name: 'IPO', heading: ['IPO Date', 'Fundamentals'] },
    { name: 'Sector', heading: ['Sector', 'Categorisation'] },
    { name: 'Industry', heading: ['Industry', 'Categorisation'] }
  ]
};
