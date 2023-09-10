import {
  Children,
  DependencyList,
  EffectCallback,
  isValidElement,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

const EMPTY_ARRAY: ReactElement[] = [];

let vuuComponentIdCount = 0;

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

export const useLayoutEffectSkipFirst = (
  func: EffectCallback,
  deps: DependencyList
) => {
  const goodToGo = useRef(false);
  useLayoutEffect(() => {
    if (goodToGo.current) {
      func();
    } else {
      goodToGo.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export const useId = (id?: string) =>
  useMemo(() => id ?? `vuu-${++vuuComponentIdCount}`, [id]);
