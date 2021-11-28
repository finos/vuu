function union(set1, ...sets) {
  const result = new Set(set1);
  for (let set of sets) {
    for (let element of set) {
      result.add(element);
    }
  }
  return result;
}

export const ArrowUp = 'ArrowUp';
export const ArrowDown = 'ArrowDown';
export const ArrowLeft = 'ArrowLeft';
export const ArrowRight = 'ArrowRight';
export const Enter = 'Enter';
export const Escape = 'Escape';

const actionKeys = new Set(['Enter', 'Delete']);
const focusKeys = new Set(['Tab']);
// const navigationKeys = new Set(["Home", "End", "ArrowRight", "ArrowLeft","ArrowDown", "ArrowUp"]);
const arrowLeftRightKeys = new Set(['ArrowRight', 'ArrowLeft']);
const navigationKeys = new Set(['Home', 'End', /*"ArrowRight", "ArrowLeft",*/ ArrowDown, ArrowUp]);
const functionKeys = new Set([
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12'
]);
const specialKeys = union(actionKeys, navigationKeys, arrowLeftRightKeys, functionKeys, focusKeys);
export const isCharacterKey = (evt) => {
  if (specialKeys.has(evt.key)) {
    return false;
  }
  if (typeof evt.which === 'number' && evt.which > 0) {
    return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which !== 8;
  }
};

export const isNavigationKey = ({ key }) => {
  return navigationKeys.has(key);
};
