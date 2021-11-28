export const FOCUS = { type: 'focus' };
export const CLICK = { type: 'click' };
export const COMMIT = { type: 'commit' };
export const ESC = { type: 'esc' };
export const TAB = { type: 'tab' };
export const TAB_BWD = { type: 'tab-bwd' };
export const UP = { type: 'up' };
export const DOWN = { type: 'down' };
export const LEFT = { type: 'left' };
export const RIGHT = { type: 'right' };
export const TEXT = { type: 'text' };
export const ENTER = { type: 'enter' };
export const HOME = { type: 'home' };
export const END = { type: 'end' };
export const PAGEUP = { type: 'page-up' };
export const PAGEDOWN = { type: 'page-down' };

export function isTabNavEvt(stateEvt) {
  switch (stateEvt.type) {
    case TAB.type:
    case TAB_BWD.type:
    case ENTER.type:
      return true;
    default:
      return false;
  }
}
