import * as Evt from '../../state-events';
import { navigationEvents, focusAnyField } from '../machine-utils';
import editTextInput from './textInput/edit-textInput';
import editSelect from './select/edit-select';
import editCombo from './combo/edit-combo';
import editComposite from './composite/edit-composite';

const state = {
  on: {
    [Evt.FOCUS.type]: focusAnyField()
  },
  states: {
    editComposite,
    editTextInput,
    editCombo,
    editSelect,
    editToggle: {
      id: 'edit-toggle',
      on: navigationEvents()
      // TEXT => id SPACE, if key in keyMap
    }
  }
};
export default state;
