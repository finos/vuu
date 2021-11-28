import { findField, nextField } from './form-selectors';

const DEFAULT_MODEL_STATE = {};

export const MultiCellEdit = 'multi-cell-edit';
export const EditReadOnly = 'edit-readonly';
export const EditEmpty = 'edit-empty';
export const SingleCellEdit = 'single-cell-edit';

export const Empty = { id: 'empty', label: '', type: 'empty', isEmpty: true };

export const initModel = (config) =>
  initialize(DEFAULT_MODEL_STATE, { type: 'INITIALIZE', config });

export default (state, action) => {
  switch (action.type) {
    case 'setNextField':
      return setNextField(state, action);
    case 'setNextCompositeField':
      return setNextCompositeField(state, action);
    case 'setField':
      return setField(state, action);
    case 'resetField':
      return clearCurrentField(state);
    default:
      return state;
  }
};

function initialize(state, action) {
  return buildState(action.config);
}

function buildState(config, legs = 2) {
  const {
    layout: { groups }
  } = config;
  const rows = [];
  const fields = [];
  let tabIdx = 1;

  groups.forEach((group, idx) => {
    if (idx !== 0) {
      rows.push({
        label: false,
        isEmpty: true,
        fields: [{ type: 'empty', isEmpty: true }]
      });
    }
    group.fields.forEach((field) => {
      const row = {
        idx,
        label: field.label,
        fields: expandField(field, tabIdx, legs)
      };
      rows.push(row);
      tabIdx += row.fields.length;
      row.fields.forEach((field) => (fields[field.tabIdx] = field));
    });
  });

  return {
    currentField: null,
    compositeFieldIdx: 0,
    fields,
    rows,
    rowIdx: -1,
    columnIdx: -1
  };
}

function expandField(field, tabIdx, legs) {
  switch (field.layout) {
    case SingleCellEdit:
      return [{ ...field, tabIdx }];

    case EditEmpty:
      return [{ ...field, tabIdx }].concat(Array(legs - 1).fill(Empty));

    case EditReadOnly:
      return [{ ...field, tabIdx }].concat(
        Array(legs - 1)
          .fill(0)
          .map(() => ({
            ...field,
            isReadonly: true,
            tabIdx: ++tabIdx
          }))
      );

    default:
      return Array(legs)
        .fill(0)
        .map(() => ({
          ...field,
          tabIdx: tabIdx++
        }));
  }
}

function clearCurrentField(state) {
  return {
    ...state,
    currentField: null,
    compositeFieldIdx: 0,
    rowIdx: -1,
    columnIdx: -1
  };
}

function setNextField(state, { evt }) {
  const field = nextField(state, evt);
  return setField(state, { evt: { field } });
}

function setNextCompositeField(state) {
  return setField(state, { evt: { compositeFieldIdx: state.compositeFieldIdx + 1 } });
}

function setField(state, action) {
  const {
    evt: { field = state.currentField, compositeFieldIdx = 0 }
  } = action;
  // console.log(`[form-reducer] setField ${field.label}[${compositeFieldIdx}] (${field.type})`)

  if (field !== state.currentField || compositeFieldIdx !== state.compositeFieldIdx) {
    const [rowIdx, columnIdx] = findField(state, field);

    return {
      ...state,
      currentField: field,
      compositeFieldIdx,
      rowIdx,
      columnIdx
    };
  } else {
    console.log(`... no change`);
    return state;
  }
}
