import { TEXT, SELECT, COMBO, DATE, TOGGLE } from '../fields';
import * as Evt from '../state-events';

export const isComposite = (field) => {
  return Array.isArray(field.type);
};

export const isComboType = (fieldType) => fieldType === COMBO || fieldType === DATE;

export const isToggle = (field) => field.type === TOGGLE;
export const isTextInput = (field) => field.type === TEXT;
export const isSelect = (field) => field.type === SELECT;
export const isCombo = (field) => isComboType(field.type);
export const canNavigate = (model, evt) => model.nextField(evt) !== model.currentField;

export const nextIdx2 = ({ idx2 }) => idx2 + 1;
export const isFirstIndex = (ctx) => ctx.idx === 0;
export const isLastIndex = (ctx) => ctx.idx === ctx.model.fields.length - 1;
export const isLastIndex2 = (ctx) => ctx.idx2 === ctx.model.fields[ctx.idx].type.length - 1;

export function prevIdx({ idx, fields }) {
  if (idx === -1) {
    return fields.length - 1;
  } else {
    return idx - 1;
  }
}

const alwaysTrue = () => true;

const isRowNavigation = (e) => {
  return e.type === 'right';
};

export const navigationEvents = () => ({
  [Evt.TAB.type]: transitionNext(),
  [Evt.TAB_BWD.type]: transitionNext(),
  [Evt.UP.type]: transitionNext(canNavigate),
  [Evt.DOWN.type]: transitionNext(canNavigate),
  [Evt.ENTER.type]: transitionNext(canNavigate),
  [Evt.LEFT.type]: transitionNext(canNavigate),
  [Evt.RIGHT.type]: transitionNext(canNavigate)
});

const setField = ['setField'];
const setNextField = ['setNextField'];
const setNextCompositeField = ['setNextCompositeField'];

export const transitionNext = (cond = alwaysTrue) => [
  { target: '#inactive', cond: (c, e) => cond(c, e) && !c.nextField(e) },
  {
    target: '#focus-composite',
    actions: setNextCompositeField,
    cond: (c, e) =>
      cond(c, e) &&
      isRowNavigation(e) &&
      isComposite(c.currentField()) &&
      c.nextCompositeFieldType(c.currentField())
  },
  {
    target: '#focus-composite',
    actions: setNextField,
    cond: (c, e) => cond(c, e) && isComposite(c.nextField(e))
  },
  {
    target: '#focus-text-input',
    actions: setNextField,
    cond: (c, e) => cond(c, e) && isTextInput(c.nextField(e))
  },
  {
    target: '#focus-select',
    actions: setNextField,
    cond: (c, e) => cond(c, e) && isSelect(c.nextField(e))
  },
  {
    target: '#focus-combo',
    actions: setNextField,
    cond: (c, e) => cond(c, e) && isCombo(c.nextField(e))
  },
  {
    target: '#edit-toggle',
    actions: setNextField,
    cond: (c, e) => cond(c, e) && isToggle(c.nextField(e))
  }
];

export const transitionNextComposite = () => [
  ...transitionNext((c) => !c.nextCompositeFieldType()),
  { target: '#focus-composite', actions: ['setNextCompositeField'] }
];

export const focusComposite = () => [
  {
    target: '#focus-composite',
    actions: setField,
    cond: (c, e) => e.field.type[e.compositeFieldIdx] === TEXT
  },
  {
    target: '#edit-composite-select',
    actions: setField,
    cond: (c, e) => e.field.type[e.compositeFieldIdx] === SELECT
  },
  {
    target: '#edit-composite-combo',
    actions: setField,
    cond: (c, e) => isComboType(e.field.type[e.compositeFieldIdx])
  }
];

export const focusAnyField = () => [
  { target: '#edit-toggle', actions: setField, cond: (_, evt) => isToggle(evt.field) },
  { target: 'focus.focusTextInput', actions: setField, cond: (_, evt) => isTextInput(evt.field) },
  // { target: 'edit.editSelect', actions: setField, cond: (_, evt) => isSelect(evt.field)},
  { target: 'focus.focusSelect', actions: setField, cond: (_, evt) => isSelect(evt.field) },
  { target: 'edit.editCombo', actions: setField, cond: (_, evt) => isCombo(evt.field) },
  ...focusComposite()
];
