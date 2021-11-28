export const CHECKBOX = 'checkbox';
export const SINGLE_ROW = 'single-row';
export const MULTIPLE_ROW = 'multiple-row';

export const SelectionModelType = {
  Checkbox: CHECKBOX,
  SingleRow: SINGLE_ROW,
  MultipleRow: MULTIPLE_ROW
};

const { Checkbox, SingleRow, MultipleRow } = SelectionModelType;

const EMPTY = [];

export function selectionDiffers(selected1, selected2) {
  const len = selected1.length;
  if (len !== selected2.length) {
    return true;
  }
  for (let i = 0; i < len; i++) {
    if (selected1[i] !== selected2[i]) {
      return true;
    }
  }
  return false;
}

export default class SelectionModel {
  constructor(selectionModelType = MultipleRow) {
    this.modelType = selectionModelType;
  }

  select({ rows: selection, lastTouchIdx }, idx, rangeSelect, keepExistingSelection) {
    let selected, deselected;

    if (this.modelType === SingleRow) {
      [selection, selected, deselected] = this.handleRegularSelection(selection, idx);
      lastTouchIdx = idx;
    } else if (rangeSelect) {
      [selection, selected, deselected] = this.handleRangeSelection(selection, lastTouchIdx, idx);
    } else if (keepExistingSelection || this.modelType === Checkbox) {
      [selection, selected, deselected] = this.handleIncrementalSelection(selection, idx);
      lastTouchIdx = idx;
    } else {
      [selection, selected, deselected] = this.handleRegularSelection(selection, idx);
      lastTouchIdx = idx;
    }

    return {
      focusedIdx: idx,
      lastTouchIdx,
      rows: selection,
      selected,
      deselected
    };
  }

  handleRegularSelection(selected, idx) {
    const pos = selected.indexOf(idx);
    if (pos === -1) {
      const selection = [idx];
      return [selection, selection, selected];
    } else if (selected.length === 1) {
      return [EMPTY, EMPTY, selected];
    } else {
      return [EMPTY, EMPTY, remove(selected, idx)];
    }
  }

  handleIncrementalSelection(selected, idx) {
    const pos = selected.indexOf(idx);
    const len = selected.length;
    const selection = [idx];

    if (pos === -1) {
      if (len === 0) {
        return [selection, selection, EMPTY];
      } else {
        return [insert(selected, idx), selection, EMPTY];
      }
    } else {
      if (len === 1) {
        return [EMPTY, EMPTY, selected];
      } else {
        return [remove(selected, idx), EMPTY, selection];
      }
    }
  }

  handleRangeSelection(selected, lastTouchIdx, idx) {
    const pos = selected.indexOf(idx);
    const len = selected.length;

    if (pos === -1) {
      if (len === 0) {
        const selection = makeRange(0, idx);
        return [selection, selection, EMPTY];
      } else if (len === 1) {
        const selection = makeRange(selected[0], idx);
        selected = selected[0] < idx ? selection.slice(1) : selection.slice(0, -1);
        return [selection, selected, EMPTY];
      } else {
        const selection = applyRange(selected, lastTouchIdx, idx);
        return [selection, selection.filter((i) => !selected.includes(i)), EMPTY];
      }
    } else {
      // TODO <<<<<<<<<<<<<<<<<
    }
  }
}

function applyRange(arr, lo, hi) {
  if (lo > hi) {
    [lo, hi] = [hi, lo];
  }

  const ranges = getRanges(arr);
  const newRange = new Range(lo, hi);
  let newRangeAdded = false;
  const ret = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];

    if (!range.overlaps(newRange)) {
      if (range.start < newRange.start) {
        for (let idx = range.start; idx <= range.end; idx++) {
          ret.push(idx);
        }
      } else {
        for (let idx = newRange.start; idx <= newRange.end; idx++) {
          ret.push(idx);
        }
        newRangeAdded = true;
        for (let idx = range.start; idx <= range.end; idx++) {
          ret.push(idx);
        }
      }
    } else if (!newRangeAdded) {
      for (let idx = newRange.start; idx <= newRange.end; idx++) {
        ret.push(idx);
      }
      newRangeAdded = true;
    }
  }

  if (!newRangeAdded) {
    for (let idx = newRange.start; idx <= newRange.end; idx++) {
      ret.push(idx);
    }
  }

  return ret;
}

function getRanges(arr) {
  const ranges = [];
  let range;

  for (let i = 0; i < arr.length; i++) {
    if (range && range.touches(arr[i])) {
      range.extend(arr[i]);
    } else {
      ranges.push((range = new Range(arr[i])));
    }
  }

  return ranges;
}

class Range {
  constructor(start, end = start) {
    this.start = start;
    this.end = end;
  }

  extend(idx) {
    if (idx >= this.start && idx > this.end) {
      this.end = idx;
    }
  }

  touches(idx) {
    return this.end === idx - 1;
  }

  overlaps(that) {
    return !(this.end < that.start || this.start > that.end);
  }

  contains(idx) {
    return this.start <= idx && this.end >= idx;
  }

  toString() {
    return `[${this.start}:${this.end}]`;
  }
}

function makeRange(lo, hi) {
  if (lo > hi) {
    [lo, hi] = [hi, lo];
  }

  const range = [];
  for (let idx = lo; idx <= hi; idx++) {
    range.push(idx);
  }
  return range;
}

function remove(arr, idx) {
  const ret = [];
  for (let i = 0; i < arr.length; i++) {
    if (idx !== arr[i]) {
      ret.push(arr[i]);
    }
  }
  return ret;
}

function insert(arr, idx) {
  const ret = [];
  for (let i = 0; i < arr.length; i++) {
    if (idx !== null && idx < arr[i]) {
      ret.push(idx);
      idx = null;
    }
    ret.push(arr[i]);
  }
  if (idx !== null) {
    ret.push(idx);
  }
  return ret;
}
