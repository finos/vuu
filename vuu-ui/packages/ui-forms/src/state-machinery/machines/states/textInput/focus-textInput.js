import * as Evt from '../../../state-events';

const state = {
  id: 'focus-text-input',
  on: {
    [Evt.TEXT.type]: { target: '#edit-text-input' }
  }
};

export default state;
