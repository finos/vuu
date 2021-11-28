import * as Evt from '../../../state-events';
import { TEXT } from '../../../fields';

import { transitionNextComposite } from '../../machine-utils';

const state = {
  id: 'focus-composite',
  on: {
    [Evt.ENTER.type]: [
      { target: '#edit-composite-combo', cond: (c) => c.isComboType() },
      { target: '#edit-composite-select', cond: (c) => c.isSelect() },
      ...transitionNextComposite()
    ],
    [Evt.TAB.type]: transitionNextComposite(),
    [Evt.TEXT.type]: [
      { target: '#edit-composite-text-input', cond: (c) => c.compositeFieldType() === TEXT },
      { target: '#edit-composite-combo', cond: (c) => c.isComboType() }
    ]
  }
};

export default state;
