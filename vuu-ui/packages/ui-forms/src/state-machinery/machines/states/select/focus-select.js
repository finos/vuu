import * as Evt from '../../../state-events';

const state = {
  id: 'focus-select',
  on: {
    [Evt.ENTER.type]: { target: '#edit-select' }
  }
};

export default state;
