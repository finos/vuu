import { useControlled, useForkRef } from "@salt-ds/core";
import {
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { measurements, useResizeObserver, WidthOnly } from "../common-hooks";
import {
  CloseReason,
  DropdownHookProps,
  DropdownHookResult,
  DropdownOpenKey,
} from "./dropdownTypes";
import { useClickAway } from "./useClickAway";

const NO_OBSERVER: string[] = [];

export const useDropdownBase = ({
  defaultIsOpen,
  disabled,
  // TODO check how we're using fullWidth, do we need a separate value for the popup component
  fullWidth: fullWidthProp,
  id,
  isOpen: isOpenProp,
  onOpenChange,
  onKeyDown: onKeyDownProp,
  openKeys = ["Enter", "ArrowDown", " "],
  openOnFocus,
  popupComponent,
  popupWidth: popupWidthProp,
  rootRef,
  width,
}: DropdownHookProps): DropdownHookResult => {
  const justFocused = useRef<number | null>(null);
  const popperRef = useRef<HTMLElement | null>(null);
  const popperCallbackRef = useCallback((element: HTMLElement | null) => {
    popperRef.current = element;
  }, []);
  const [isOpen, setIsOpen] = useControlled({
    controlled: isOpenProp,
    default: Boolean(defaultIsOpen),
    name: "useDropdown",
    state: "isOpen",
  });
  const [popup, setPopup] = useState<measurements>({
    width: popupWidthProp ?? width ?? 0,
  });

  const showDropdown = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange, setIsOpen]);

  const hideDropdown = useCallback(
    (reason: CloseReason) => {
      setIsOpen(false);
      onOpenChange?.(false, reason);
    },
    [onOpenChange, setIsOpen]
  );

  useClickAway({
    popperRef,
    rootRef,
    isOpen,
    onClose: hideDropdown,
  });

  const handleTriggerFocus = useCallback(() => {
    if (!disabled) {
      if (openOnFocus) {
        setIsOpen(true);
        onOpenChange?.(true);
        // Suppress response to click if click was the cause of focus
        justFocused.current = window.setTimeout(() => {
          justFocused.current = null;
        }, 1000);
      }
    }
  }, [disabled, onOpenChange, openOnFocus, setIsOpen]);

  const handleTriggerToggle = useCallback(
    (e: MouseEvent) => {
      // Do not trigger menu open for 'Enter' and 'SPACE' key as they're handled in `handleKeyDown`
      if (
        ["Enter", " "].indexOf(
          (e as unknown as KeyboardEvent<HTMLDivElement>).key
        ) === -1
      ) {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        onOpenChange?.(newIsOpen);
      }
    },
    [isOpen, setIsOpen, onOpenChange]
  );

  const handleKeydown = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => {
      if (/* evt.key === "Tab" || */ evt.key === "Escape" && isOpen) {
        // No preventDefault for Tab, but if we've handled Escape, we should own it
        if (evt.key === "Escape") {
          evt.stopPropagation();
          evt.preventDefault();
        }
        hideDropdown(evt.key);
      } else if (openKeys.includes(evt.key as DropdownOpenKey) && !isOpen) {
        evt.preventDefault();
        showDropdown();
      } else {
        onKeyDownProp?.(evt);
      }
    },
    [hideDropdown, isOpen, onKeyDownProp, openKeys, showDropdown]
  );

  const handleBlur = useCallback(
    (evt: FocusEvent<HTMLElement>) => {
      if (isOpen) {
        if (popperRef.current?.contains(evt.relatedTarget)) {
          // ignore
        } else {
          hideDropdown("blur");
        }
      }
    },
    [hideDropdown, isOpen]
  );

  const fullWidth = fullWidthProp ?? false;
  const measurements = fullWidth ? WidthOnly : NO_OBSERVER;
  useResizeObserver(rootRef, measurements, setPopup, fullWidth);

  const componentId = `${id}-dropdown`;

  // TODO do we use aria-popup - valid values are menu, disloag, grid, tree, listbox
  const triggerProps = {
    "aria-expanded": isOpen,
    "aria-owns": isOpen ? componentId : undefined,
    id: `${id}-control`,
    onClick: disabled || openOnFocus ? undefined : handleTriggerToggle,
    onFocus: handleTriggerFocus,
    role: "listbox",
    onBlur: handleBlur,
    onKeyDown: disabled ? undefined : handleKeydown,
    style: { width: fullWidth ? undefined : width },
  };

  const dropdownComponentProps = {
    id: componentId,
    width: popup.width,
  };

  const popupComponentRef = useForkRef(popperCallbackRef, popupComponent.ref);

  return {
    componentProps: dropdownComponentProps,
    popupComponentRef,
    isOpen,
    label: "Dropdown Button",
    triggerProps,
  };
};
