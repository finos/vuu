import cx from "clsx";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";

import "./ChromeSelect.css";

export interface ChromeSelectOption<T extends string = string> {
  description?: ReactNode;
  icon?: ReactNode;
  label: string;
  /** e.g a status indicator, rendered after the label */
  adornment?: ReactNode;
  value: T;
}

export interface ChromeSelectProps<T extends string = string> {
  "aria-label": string;
  className?: string;
  /** rendered at the foot of the popup list */
  footer?: ReactNode;
  icon?: ReactNode;
  onChange: (value: T) => void;
  onOpenChange?: (open: boolean) => void;
  options: ChromeSelectOption<T>[];
  value: T;
}

const classBase = "ShowcaseSelect";

/**
 * A select styled for the showcase chrome. A button that opens a listbox
 * popup, with the usual keyboard support (arrows, Home/End, Enter, Escape).
 */
export const ChromeSelect = <T extends string = string>({
  "aria-label": ariaLabel,
  className,
  footer,
  icon,
  onChange,
  onOpenChange,
  options,
  value,
}: ChromeSelectProps<T>) => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, _setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];

  const setOpen = useCallback(
    (isOpen: boolean) => {
      _setOpen(isOpen);
      onOpenChange?.(isOpen);
    },
    [onOpenChange],
  );

  const openList = useCallback(() => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }, [selectedIndex, setOpen]);

  const close = useCallback(
    (restoreFocus = true) => {
      setOpen(false);
      if (restoreFocus) {
        buttonRef.current?.focus();
      }
    },
    [setOpen],
  );

  const select = useCallback(
    (index: number) => {
      const option = options[index];
      if (option) {
        onChange(option.value);
      }
      close();
    },
    [close, onChange, options],
  );

  useEffect(() => {
    if (open) {
      listRef.current?.focus();
      const handlePointerDown = (e: PointerEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) {
          close(false);
        }
      };
      document.addEventListener("pointerdown", handlePointerDown);
      return () =>
        document.removeEventListener("pointerdown", handlePointerDown);
    }
  }, [close, open]);

  const handleButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openList();
    }
  };

  const handleListKeyDown = (e: KeyboardEvent) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        setActiveIndex((index) => Math.min(last, index + 1));
        break;
      case "ArrowUp":
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case "Home":
        setActiveIndex(0);
        break;
      case "End":
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        select(activeIndex);
        break;
      case "Escape":
      case "Tab":
        close(e.key === "Escape");
        if (e.key === "Tab") {
          return;
        }
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const optionId = (index: number) => `${id}-option-${index}`;

  return (
    <div className={cx(classBase, className)} ref={rootRef}>
      <button
        aria-controls={open ? `${id}-list` : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`${classBase}-button`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={handleButtonKeyDown}
        ref={buttonRef}
        type="button"
      >
        {icon ?? selected?.icon}
        <span className={`${classBase}-value`}>{selected?.label}</span>
        <ChromeIcon name="selector" size={14} />
      </button>
      {open ? (
        <div className={`${classBase}-popup`}>
          <ul
            aria-activedescendant={optionId(activeIndex)}
            aria-label={ariaLabel}
            className={`${classBase}-list`}
            id={`${id}-list`}
            onKeyDown={handleListKeyDown}
            ref={listRef}
            role="listbox"
            tabIndex={-1}
          >
            {options.map((option, index) => (
              <li
                aria-selected={index === selectedIndex}
                className={cx(`${classBase}-option`, {
                  [`${classBase}-option-active`]: index === activeIndex,
                })}
                id={optionId(index)}
                key={option.value}
                onClick={() => select(index)}
                onPointerMove={() => setActiveIndex(index)}
                role="option"
              >
                {option.icon ? (
                  <span className={`${classBase}-optionIcon`}>
                    {option.icon}
                  </span>
                ) : null}
                <span className={`${classBase}-optionText`}>
                  <span className={`${classBase}-optionLabel`}>
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className={`${classBase}-optionDescription`}>
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {option.adornment}
                <span className={`${classBase}-check`}>
                  {index === selectedIndex ? (
                    <ChromeIcon name="check" size={14} />
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {footer ? (
            <div className={`${classBase}-footer`}>{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
