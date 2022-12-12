import React, { useCallback, useMemo, useRef, useState } from "react";
import { useViewContext } from "@vuu-ui/vuu-layout";

export const StatefulComponent = ({ initialState = "", style, stateKey }) => {
  const { load, save } = useViewContext();
  // TODO store state in ref in view and pas vie context.viewStates
  const storedState = useMemo(() => load(stateKey), [load, stateKey]);
  const state = useRef(storedState ?? initialState);
  const [value, setValue] = useState(state.current);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setValue((state.current = value));
      save(value, stateKey);
    },
    [save, stateKey]
  );

  return <textarea style={style} onChange={handleChange} value={value} />;
};
