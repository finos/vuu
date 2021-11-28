import * as Evt from '../../../state-events';
import { transitionNext } from '../../machine-utils';

const state = {
  id: 'edit-combo',
  on: {
    [Evt.ESC.type]: { target: '#focus-combo' },
    [Evt.COMMIT.type]: [
      { target: '#focus-combo', cond: (c) => !c.isKeyboardNavigation() },
      ...transitionNext()
    ]
  }
};

export default state;
