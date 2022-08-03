import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';

export interface UseControlledProps<T = unknown> {
  controlled: T | undefined;
  default: T | undefined;
}

export function useControlled<T = unknown>({
  controlled,
  default: defaultProp
}: UseControlledProps<T>): [T | undefined, Dispatch<SetStateAction<T>>, boolean] {
  const { current: isControlled } = useRef(controlled !== undefined);
  const [valueState, setValue] = useState(defaultProp);
  const value = isControlled ? controlled : valueState;
  const setValueIfUncontrolled = useCallback(
    (newValue) => {
      if (!isControlled) {
        setValue(newValue);
      }
    },
    [isControlled]
  );

  return [value, setValueIfUncontrolled, isControlled];
}
