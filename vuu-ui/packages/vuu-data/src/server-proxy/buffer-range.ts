export interface FromToRange {
  from: number;
  to: number;
}

export const bufferBreakout = (range: FromToRange, from: number, to: number, bufferSize: number): boolean => {
  const bufferPerimeter = bufferSize * 0.25;
  if (!range || !bufferSize) {
    return true;
  } else if (range.to - to < bufferPerimeter) {
    return true;
  } else if (range.from > 0 && from - range.from < bufferPerimeter) {
    return true;
  } else {
    return false;
  }
};
