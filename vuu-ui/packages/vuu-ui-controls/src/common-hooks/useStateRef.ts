import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";

const isSimpleStateValue = <T>(arg: SetStateAction<T>): arg is T =>
  typeof arg !== "function";

// Keeps a ref value in sync with a state value
export const useStateRef = <T = string>(
  initialValue: T
): [MutableRefObject<T>, Dispatch<SetStateAction<T>>] => {
  const [value, _setValue] = useState<T>(initialValue);
  const ref = useRef<T>(value);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>((arg) => {
    if (isSimpleStateValue(arg)) {
      ref.current = arg;
      _setValue(arg);
    } else {
      const { current: prev } = ref;
      ref.current = arg(prev);
      _setValue(ref.current);
    }
  }, []);
  return [ref, setValue];
};
