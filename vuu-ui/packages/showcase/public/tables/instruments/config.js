export const config = {
  name: 'Instruments',
  dataUrl: '/tables/instruments/instruments.js',
  type: 'vs',
  primaryKey: 'Symbol',
  columns: [
    { name: 'Symbol' },
    { name: 'Name' },
    { name: 'Price', type: { name: 'price' }, aggregate: 'avg' },
    { name: 'MarketCap', type: { name: 'number', format: 'currency' }, aggregate: 'sum' },
    { name: 'IPO', type: 'year' },
    { name: 'Sector' },
    { name: 'Industry' }
  ],
  updates: {
    interval: 40,
    fields: ['Price'],
    applyInserts: false,
    applyUpdates: true
  }
};
