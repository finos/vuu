import * as Evt from '../../../state-events';

const state = {
  id: 'focus-combo',
  on: {
    [Evt.TEXT.type]: { target: '#edit-combo' },
    [Evt.ENTER.type]: { target: '#edit-combo' }
  }
};

export default state;
