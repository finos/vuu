import inactive from './states/inactive';
import focus from './states/focus.js';
import edit from './states/edit.js';

export const states = {
  initial: 'inactive',
  states: {
    inactive,
    focus,
    edit
  }
};
