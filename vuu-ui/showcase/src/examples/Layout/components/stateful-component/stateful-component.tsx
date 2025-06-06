import { useViewContext } from "@vuu-ui/vuu-layout";
import { registerComponent } from "@vuu-ui/vuu-utils";
import React, {
  ChangeEventHandler,
  HTMLAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export interface StatefulComponentProps extends HTMLAttributes<HTMLDivElement> {
  initialState?: string;
  stateKey?: string;
}

export const StatefulComponent = ({
  initialState = "",
  style,
  stateKey = "?",
}: StatefulComponentProps) => {
  const { load, save } = useViewContext();
  const storedState = useMemo(() => load?.(stateKey), [load, stateKey]);
  const state = useRef(storedState ?? initialState);
  const [value, setValue] = useState(state.current);

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    (e) => {
      const value = e.target.value;
      setValue((state.current = value));
      save?.(value, stateKey);
    },
    [save, stateKey],
  );

  return (
    <textarea style={style} onChange={handleChange} value={value.toString()} />
  );
};

registerComponent("StatefulComponent", StatefulComponent, "view");
