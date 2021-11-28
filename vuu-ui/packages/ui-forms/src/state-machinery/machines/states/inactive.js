import * as Evt from '../../state-events';
import { transitionNext, focusAnyField } from '../machine-utils';

const state = {
  id: 'inactive',
  onEntry: 'resetField',
  on: {
    [Evt.TAB.type]: transitionNext(),
    [Evt.FOCUS.type]: focusAnyField()
  }
};

export default state;
