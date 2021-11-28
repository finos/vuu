import * as Evt from '../../../state-events';
import { transitionNext } from '../../machine-utils';

const state = {
  id: 'edit-text-input',
  on: {
    [Evt.ESC.type]: { target: '#focus-text-input' },
    [Evt.TAB.type]: transitionNext(),
    [Evt.ENTER.type]: [
      { target: '#focus-text-input', cond: (c) => !c.isKeyboardNavigation() },
      ...transitionNext()
    ]
  }
};

export default state;
