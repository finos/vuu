import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
} from "react";

const EMPTY_ARRAY: ReactElement[] = [];

export const asReactElements = (
  children: ReactNode,
  throwIfNoChildren = false,
): ReactElement[] => {
  const isArray = Array.isArray(children);
  const count = isArray ? children.length : Children.count(children);
  if (isArray && children.every(isValidElement)) {
    return children;
  } else if (count === 1 && !isArray && isValidElement(children)) {
    return [children];
  } else if (count > 1) {
    const elements: ReactElement[] = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        elements.push(child);
      } else {
        console.warn(`GridLayoutStackedItem has unexpected child element type`);
      }
    });
    return elements;
  } else if (throwIfNoChildren) {
    throw Error(`[asReactElements] no child element(s)`);
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
