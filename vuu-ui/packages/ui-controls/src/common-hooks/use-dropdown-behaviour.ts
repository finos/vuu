import { SyntheticEvent, useCallback } from "react";
import { ArrowDown, Escape, useControlled } from "../utils";

const NO_OPTS = {};

export interface DropdownBehaviourHookProps {
  defaultOpen?: boolean;
  open?: boolean;
  onClose?: (e: SyntheticEvent, open: boolean) => void;
  onOpen?: (e: SyntheticEvent, open: boolean) => void;
  openOnFocus?: boolean;
}

export const useDropdownBehaviour = ({
  defaultOpen = false,
  open: openProp,
  onClose,
  onOpen,
  openOnFocus,
}: DropdownBehaviourHookProps = NO_OPTS) => {
  const [open, _setIsOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
  });

  const setIsOpen = useCallback(
    (e, open = e) => {
      _setIsOpen(open);
      const callback = open ? onOpen : onClose;
      callback && callback(e, open);
    },
    [_setIsOpen, onClose, onOpen]
  );

  const onBlur = useCallback(
    (e) => {
      if (open) {
        setIsOpen(e, false);
      }
    },
    [open, setIsOpen]
  );

  const onFocus = useCallback(
    (e) => {
      if (!open && openOnFocus) {
        setIsOpen(e, true);
      }
    },
    [open, openOnFocus, setIsOpen]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === ArrowDown) {
        if (!open) {
          setIsOpen(true);
          e.preventDefault();
          e.stopPropagation();
        }
      } else if (e.key === Escape) {
        if (open) {
          setIsOpen(false);
          e.stopPropagation();
          e.preventDefault();
        }
      }
    },
    [open, setIsOpen]
  );

  return {
    onBlur,
    onFocus: openOnFocus ? onFocus : undefined,
    onKeyDown,
    open,
    setIsOpen,
  };
};
