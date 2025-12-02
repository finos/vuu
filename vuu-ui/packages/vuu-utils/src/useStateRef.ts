import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";

/**
 * Extension to useState that maintains a ref for the
 * current state value. Useful where use of the ref can
 * avoid referencing the state vale in a dependency array
 * eg on a native event handler.
 *
 * @param value the initial value to store
 */

const isSimpleStateValue = <T>(arg: SetStateAction<T>): arg is T =>
  typeof arg !== "function";

// Keeps a ref value in sync with a state value
export const useStateRef = <T = string>(
  initialValue: T,
): [RefObject<T>, Dispatch<SetStateAction<T>>] => {
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
