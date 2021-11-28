import { useRef } from 'react';
import { Machine } from 'xstate';
import * as StateEvt from './state-machinery/state-events';

function useStateMachine(states, ctx, dispatch) {
  const stateMachine = useRef(new Machine(states, null, ctx));
  const state = useRef(stateMachine.current.initialState);

  function stateTransition(evt) {
    if (state.current.event === StateEvt.TAB && evt.type === 'commit') {
      // ignore
    } else {
      const { type, field: { label } = {}, compositeFieldIdx } = evt;
      console.group(
        `%c on ${type} @ ${label}[${compositeFieldIdx}], from state: ${JSON.stringify(
          state.current.value
        )}`,
        'color: blue;font-weight: bold;'
      );
      const nextState = (state.current = stateMachine.current.transition(state.current, evt));
      nextState.actions.forEach(({ type }) => dispatch({ type, evt }));
      console.log(
        `%c    => to state: ${JSON.stringify(state.current.value)} [${
          state.current.context.compositeFieldIdx
        }]`,
        'color: blue;font-weight: bold;'
      );
      console.log({ actions: nextState.actions });
      console.groupEnd();
    }
  }

  return [state, stateTransition];
}

export default useStateMachine;
