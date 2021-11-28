import * as Evt from '../../../state-events';
import { transitionNextComposite } from '../../machine-utils';

const state = {
  id: 'edit-composite',
  initial: 'unknown',
  on: {
    [Evt.TAB.type]: transitionNextComposite(),
    [Evt.ESC.type]: { target: '#focus-composite' }
  },
  states: {
    textInput: {
      id: 'edit-composite-text-input',
      on: {
        [Evt.COMMIT.type]: transitionNextComposite()
      }
    },
    select: {
      id: 'edit-composite-select',
      on: {
        [Evt.COMMIT.type]: transitionNextComposite()
      }
    },
    combo: {
      id: 'edit-composite-combo',
      on: {
        [Evt.COMMIT.type]: transitionNextComposite()
      }
    },
    unknown: {}
  }
};

export default state;
