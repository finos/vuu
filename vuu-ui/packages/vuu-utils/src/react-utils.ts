import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
} from "react";

const EMPTY_ARRAY: ReactElement[] = [];

export const asReactElements = (children: ReactNode): ReactElement[] => {
  const isArray = Array.isArray(children);
  const count = isArray ? children.length : Children.count(children);
  if (isArray && children.every(isValidElement)) {
    return children;
  } else if (count === 1 && !isArray && isValidElement(children)) {
    return [children];
  } else if (count > 1) {
    return children as ReactElement[];
  } else {
    return EMPTY_ARRAY;
  }
};

export const useIsMounted = (id = "") => {
  const isMountedRef = useRef(false);
  useEffect(() => {
    console.log(`is MOUNTED ${id}`);
    isMountedRef.current = true;
    return () => {
      console.log(`is UNMOUNTED ${id}`);
      isMountedRef.current = false;
    };
  }, [id]);

  return isMountedRef;
};

export const isSimpleStateValue = <T>(arg: SetStateAction<T>): arg is T =>
  typeof arg !== "function";

/**
 * From an example by stack overflow user Maxim G
 */
export const createSyntheticEvent = <T extends Element, E extends Event>(
  event: E,
): React.SyntheticEvent<T, E> => {
  let isDefaultPrevented = false;
  let isPropagationStopped = false;
  const preventDefault = () => {
    isDefaultPrevented = true;
    event.preventDefault();
  };
  const stopPropagation = () => {
    isPropagationStopped = true;
    event.stopPropagation();
  };
  return {
    nativeEvent: event,
    currentTarget: event.currentTarget as EventTarget & T,
    target: event.target as EventTarget & T,
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    defaultPrevented: event.defaultPrevented,
    eventPhase: event.eventPhase,
    isTrusted: event.isTrusted,
    preventDefault,
    isDefaultPrevented: () => isDefaultPrevented,
    stopPropagation,
    isPropagationStopped: () => isPropagationStopped,
    persist: () => undefined,
    timeStamp: event.timeStamp,
    type: event.type,
  };
};

/**
 * Store a value in a RefObject and update that ref whenever the value changes.
 * Use to maintain a stable reference to a changing value that we need to use
 * within a hook, but when that hook does not need to be triggered just because
 * this value changes.
 */
export const useStableReference = <T>(value: T) => {
  const referenceToProp = useRef<T>(value);
  useMemo(() => (referenceToProp.current = value), [value]);
  return referenceToProp;
};
