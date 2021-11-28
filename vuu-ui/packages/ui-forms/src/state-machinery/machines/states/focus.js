import * as Evt from '../../state-events';
import { navigationEvents, focusAnyField } from '../machine-utils';
import focusTextInput from './textInput/focus-textInput';
import focusSelect from './select/focus-select';
import focusCombo from './combo/focus-combo';
import focusComposite from './composite/focus-composite';

const state = {
  id: 'cell-focussed',
  on: {
    ...navigationEvents(),
    [Evt.FOCUS.type]: focusAnyField()
  },
  states: {
    focusTextInput,
    focusSelect,
    focusCombo,
    focusComposite
  }
};

export default state;
