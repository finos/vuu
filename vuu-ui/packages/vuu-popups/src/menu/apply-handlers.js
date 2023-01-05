export const applyHandlers = (props, evtName, ...params) => {
  const isPropagationStopped = () => params?.[0].isPropagationStopped?.();

  if (props.length > 0 && !isPropagationStopped()) {
    const additionalHandlers = props
      .filter((props) => props[evtName])
      .map((props) => props[evtName]);
    for (let handleEvent of additionalHandlers) {
      if (isPropagationStopped()) {
        break;
      }
      handleEvent(...params);
    }
  }
};
