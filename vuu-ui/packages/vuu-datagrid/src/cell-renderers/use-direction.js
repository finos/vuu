import { useEffect, useRef } from 'react';

const INITIAL_VALUE = [null, null, null, null];

export const UP1 = 'up1';
export const UP2 = 'up2';
export const DOWN1 = 'down1';
export const DOWN2 = 'down2';

export default function useDirection(key, value, column) {
  const ref = useRef(null);
  const [prevKey, prevValue, prevColumn, prevDirection] = ref.current || INITIAL_VALUE;
  const direction =
    key === prevKey && column === prevColumn && Number.isFinite(prevValue) && Number.isFinite(value)
      ? getDirection(prevDirection, prevValue, value, column)
      : '';

  useEffect(() => {
    ref.current = [key, value, column, direction];
  });

  return direction;
}

function getDirection(direction, prevValue, newValue, column) {
  if (!Number.isFinite(newValue)) {
    return '';
  } else if (prevValue !== null && newValue !== null) {
    let diff = newValue - prevValue;
    if (diff) {
      // make sure there is still a diff when reduced to number of decimals to be displayed
      const { type: dataType } = column;
      let decimals = dataType && dataType.formatting && dataType.formatting.decimals;
      if (typeof decimals === 'number') {
        diff = +newValue.toFixed(decimals) - +prevValue.toFixed(decimals);
      }
    }

    if (diff) {
      if (direction === '') {
        if (diff < 0) {
          return DOWN1;
        } else {
          return UP1;
        }
      } else if (diff > 0) {
        if (direction === DOWN1 || direction === DOWN2 || direction === UP2) {
          return UP1;
        } else {
          return UP2;
        }
      } else if (direction === UP1 || direction === UP2 || direction === DOWN2) {
        return DOWN1;
      } else {
        return DOWN2;
      }
    }
  }
}
