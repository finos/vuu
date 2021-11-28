import * as Evt from '../../../state-events';
import { transitionNext } from '../../machine-utils';

const state = {
  id: 'edit-select',
  on: {
    [Evt.ESC.type]: { target: '#focus-select' },
    [Evt.COMMIT.type]: [
      { target: '#focus-select', cond: (c) => !c.isKeyboardNavigation() },
      ...transitionNext()
    ]
  }
};

export default state;
