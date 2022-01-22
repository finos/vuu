import { useLayoutEffect, useRef } from 'react';

import { useControlled } from '../utils';

const NO_OPTS = {};

export const useDropdown = ({
  closeOnSelect = true,
  defaultOpen = false,
  id,
  open: openProp,
  onCancel,
  onChange,
  onDropdownChange
} = NO_OPTS) => {
  const [open, _setIsOpen, isControlled] = useControlled({
    controlled: openProp,
    default: defaultOpen
  });
  const isOpenRef = useRef(open);

  useLayoutEffect(() => {
    isOpenRef.current = openProp;
  }, [openProp]);

  const setIsOpen = (open) => {
    onDropdownChange && onDropdownChange(open);
    if (!isControlled) {
      _setIsOpen((isOpenRef.current = open));
    }
  };

  const ariaAttributes = open
    ? {
        'aria-expanded': true,
        'aria-owns': id
      }
    : undefined;

  const triggerHandlers = {
    ...ariaAttributes,
    onClickCapture: () => {
      if (!isOpenRef.current) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    },
    onKeyDownCapture: (e) => {
      if (e.key === 'Enter') {
        if (isOpenRef.current) {
          if (closeOnSelect) {
            // assuming single select
            requestAnimationFrame(() => {
              setIsOpen(false);
            });
          }
        } else {
          setIsOpen(true);
          e.preventDefault();
          e.stopPropagation();
        }
      } else if (e.key === 'ArrowDown') {
        if (!isOpenRef.current) {
          setIsOpen(true);
          e.preventDefault();
          e.stopPropagation();
        }
      } else if (e.key === 'Escape') {
        if (isOpenRef.current) {
          setIsOpen(false);
          e.stopPropagation();
          e.preventDefault();
          onCancel && onCancel();
        }
      }
    }
  };

  const dropdownHandlers = {
    onKeyDownCapture: (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        onCancel && onCancel();
      }
    },
    onChange: (e, selected) => {
      onChange && onChange(e, selected);
      if (isOpenRef.current) {
        //TODO need to look inti this, not sure it's right
        if (closeOnSelect) {
          // assuming single select
          requestAnimationFrame(() => {
            setIsOpen(false);
          });
        }
      }
    }
  };

  return {
    dropdownHandlers,
    isOpen: open,
    triggerHandlers,
    setIsOpen
  };
};
