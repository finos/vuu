import * as Evt from './state-machinery/state-events';
import { SELECT, COMBO, DATE } from './state-machinery/fields';

const UP = Evt.UP.type;
const DOWN = Evt.DOWN.type;
const TAB = Evt.TAB.type;
const BACK = Evt.TAB_BWD.type;
const LEFT = Evt.LEFT.type;
const RIGHT = Evt.RIGHT.type;
const ENTER = Evt.ENTER.type;
const COMMIT = Evt.COMMIT.type;

const NavEvts = {
  [DOWN]: true,
  [UP]: true,
  [TAB]: true,
  [BACK]: true,
  [ENTER]: true,
  [COMMIT]: true
};

const isFormNavigationEvent = ({ type }) => NavEvts[type];
const isRowNavigationEvent = ({ type }) => type === LEFT || type === RIGHT;

// TODO - called often, cahe results
export function findField(state, field) {
  const { rows, legCount } = state;
  for (let i = 0; i < rows.length; i++) {
    const { fields } = rows[i];
    const count = fields.length;
    for (let j = 0; j < count; j++) {
      if (fields[j] === field) {
        if (count === 1 && legCount > 1) {
          return [
            i,
            Array(legCount)
              .fill(0)
              .map((_, i) => i)
          ];
        } else {
          return [i, j];
        }
      }
    }
  }
}

export function currentField(state) {
  return state.currentField;
}

export function nextField(state, evt, field = state.currentField, field2 = field) {
  const { rows, legCount, columnIdx } = state;
  const [rowIdx] = findField(state, field, rows, legCount);

  if (isFormNavigationEvent(evt)) {
    const [row, columnIdx] = nextRow(state, rowIdx, evt.type);
    if (row) {
      let { fields: nextFields } = row;
      if (nextFields.length === 1) {
        return nextFields[0];
      } else {
        const next = nextFields[columnIdx];
        if (next.isEmpty || next.isReadOnly) {
          return nextField(state, evt, next, field2);
        } else {
          return next;
        }
      }
    }
  } else if (isRowNavigationEvent(evt)) {
    const { fields } = rows[rowIdx];
    const next = nextFieldInRow(state, fields, columnIdx, evt.type);
    if (next) {
      return next;
    }
  }
  // returning null will inactivate the form, we only want TAB to do that
  return evt.type === TAB ? null : field2;
}

function nextRow(state, idx, evtType, colIdx = state.columnIdx) {
  const { rows, legCount } = state;
  const nextIdx =
    evtType === DOWN || evtType === TAB || evtType === ENTER || evtType === COMMIT
      ? idx + 1
      : idx - 1;

  const next = rows[nextIdx];

  if (next === undefined) {
    // are we in a position to tab move to head of next column ?
    if (evtType === TAB && legCount > 1 && colIdx < legCount - 1) {
      return this.nextRow(-1, evtType, colIdx + 1);
    } else if (evtType === BACK && legCount > 1 && colIdx > 0) {
      // ... or to foot of previous column ...
      return nextRow(state, -1, evtType, colIdx - 1);
    } else {
      return [null];
    }
  } else if (next.isEmpty || next.isReadOnly) {
    return nextRow(state, nextIdx, evtType);
  } else {
    return [next, colIdx];
  }
}

function nextFieldInRow(state, fields, idx, direction = DOWN) {
  const nextIdx = direction === RIGHT ? idx + 1 : idx - 1;

  const next = fields[nextIdx];

  if (next === undefined) {
    return null;
  } else if (next.isEmpty || next.isReadOnly) {
    return nextFieldInRow(fields, nextIdx, direction);
  } else {
    return next;
  }
}

export function compositeFieldType(state, field = state.currentField) {
  // console.log(`compositeFieldType ${JSON.stringify(field)} compositeFieldIdx=${this.compositeFieldIdx}`);
  return field.type[state.compositeFieldIdx];
}

export function nextCompositeFieldType(state, field = state.currentField) {
  const { type } = field;
  if (Array.isArray(type)) {
    // console.log(`nextCompositeFieldType for field ${JSON.stringify(field)} compositeIdx=${this.compositeFieldIdx} ${type[this.compositeFieldIdx+1]}`)
    return type[state.compositeFieldIdx + 1];
  }
}

export const isComposite = (field) => {
  return Array.isArray(field.type);
};

const isComboType = (fieldType) => fieldType === COMBO || fieldType === DATE;

export const isSelect = (state, field = state.currentField) =>
  isComposite(field) ? field[state.compositeFieldIdx] === SELECT : field.type === SELECT;

export const isCombo = (state, field = state.currentField) =>
  isComposite(field) ? isComboType(field.type[state.compositeFieldIdx]) : isComboType(field.type);
