export const TEXT = 'TextInput';
export const SELECT = 'Select';
export const COMBO = 'Combo';
export const DATE = 'Date';
export const TOGGLE = 'Toggle';

export const fields = [
  { name: 'field1', type: TEXT },
  { name: 'field2', type: 'Select' },
  { name: 'field3', type: TEXT },
  { name: 'field4', type: 'Selector' },
  { name: 'field5', type: 'Select' },
  { name: 'field6', type: 'Select' }
];

export const fieldsWithComposites = [
  { name: 'field1', type: TEXT },
  { name: 'field2', type: [SELECT, TEXT] },
  { name: 'field3', type: TEXT },
  { name: 'field4', type: [TEXT, SELECT] }
];
