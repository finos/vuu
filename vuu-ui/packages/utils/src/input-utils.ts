const actionKeys = ['Enter', 'Delete'];
const navigationKeys = ['Home', 'End', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Tab'];
const functionKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

const specialKeys = actionKeys
  .concat(navigationKeys)
  .concat(functionKeys)
  .reduce((map, key) => {
    map[key] = true;
    return map;
  }, {});

export const isCharacterKey = (evt: KeyboardEvent) => {
  if (specialKeys[evt.key]) {
    return false;
  }
  if (typeof evt.which === 'number' && evt.which > 0) {
    return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which !== 8;
  }
};

export const isQuoteKey = (evt: KeyboardEvent) => {
  console.log(`key = >${evt.key}<`);
  return evt.key === '"' || evt.key === "'";
};
