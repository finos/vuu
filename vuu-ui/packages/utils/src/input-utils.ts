const actionKeys = {
  Enter: 'Enter',
  Delete: 'Delete'
};

const navigationKeys = {
  Home: 'Home',
  End: 'End',
  ArrowRight: 'ArrowRight',
  ArrowLeft: 'ArrowLeft',
  ArrowDown: 'ArrowDown',
  ArrowUp: 'ArrowUp',
  Tab: 'Tab'
};
const functionKeys = {
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12'
};

const specialKeys = {
  ...actionKeys,
  ...navigationKeys,
  ...functionKeys
};
type specialKey = keyof typeof specialKeys;

const isSpecialKey = (key: string): key is specialKey => key in specialKeys;

export const isCharacterKey = (evt: KeyboardEvent) => {
  if (isSpecialKey(evt.key)) {
    return false;
  }
  if (typeof evt.which === 'number' && evt.which > 0) {
    return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which !== 8;
  }
};

export const isQuoteKey = (evt: KeyboardEvent) => {
  return evt.key === '"' || evt.key === "'";
};
