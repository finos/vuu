import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
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
