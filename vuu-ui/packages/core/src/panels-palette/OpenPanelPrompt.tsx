import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type OpenPanelChoice = "replace" | "stack" | "cancel";

export interface OpenPanelPromptProps {
  /** Label of the focused panel the choice applies to. */
  label: string;
  onChoice: (choice: OpenPanelChoice) => void;
  /** The focused panel, the prompt is anchored to it. */
  target: Element | null;
  /** Label of the panel being opened. */
  templateLabel: string;
}

const TARGET_ATTRIBUTE = "data-open-panel-target";

const choices = ["replace", "stack"] as const;

/**
 * Asks whether to replace the focused panel or open a new tab beside it.
 * R and T choose, arrows and Enter too, Esc or a click elsewhere cancels.
 */
export const OpenPanelPrompt = ({
  label,
  onChoice,
  target,
  templateLabel,
}: OpenPanelPromptProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<{ left: number; top: number }>();

  useLayoutEffect(() => {
    target?.setAttribute(TARGET_ATTRIBUTE, "");
    const rect = target?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      const menuWidth = menuRef.current?.offsetWidth ?? 240;
      setPosition({
        left: Math.max(8, rect.left + (rect.width - menuWidth) / 2),
        top: rect.top + Math.min(48, rect.height / 3),
      });
    }
    menuRef.current?.focus();
    return () => target?.removeAttribute(TARGET_ATTRIBUTE);
  }, [target]);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        onChoice("cancel");
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onChoice("cancel");
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onChoice]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      switch (event.key.toLowerCase()) {
        case "r":
          event.preventDefault();
          return onChoice("replace");
        case "t":
          event.preventDefault();
          return onChoice("stack");
        case "arrowdown":
        case "arrowup":
          event.preventDefault();
          return setActiveIndex((index) => 1 - index);
        case "enter":
        case " ":
          event.preventDefault();
          return onChoice(choices[activeIndex]);
      }
    },
    [activeIndex, onChoice],
  );

  return (
    <div
      aria-label={`Open ${templateLabel}`}
      className="vuuOpenPanelPrompt"
      onKeyDown={handleKeyDown}
      ref={menuRef}
      role="menu"
      style={position}
      tabIndex={-1}
    >
      <div className="vuuOpenPanelPrompt-header">Open {templateLabel}</div>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the menu handles keys for its items */}
      <div
        aria-keyshortcuts="R"
        className="vuuOpenPanelPrompt-item"
        data-active={activeIndex === 0 || undefined}
        onClick={() => onChoice("replace")}
        onPointerEnter={() => setActiveIndex(0)}
        role="menuitem"
        tabIndex={-1}
      >
        <span>
          Replace <b>{label}</b>
        </span>
        <kbd>R</kbd>
      </div>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the menu handles keys for its items */}
      <div
        aria-keyshortcuts="T"
        className="vuuOpenPanelPrompt-item"
        data-active={activeIndex === 1 || undefined}
        onClick={() => onChoice("stack")}
        onPointerEnter={() => setActiveIndex(1)}
        role="menuitem"
        tabIndex={-1}
      >
        <span>Open as new tab</span>
        <kbd>T</kbd>
      </div>
      <div className="vuuOpenPanelPrompt-footer">
        Esc to cancel · drag to place exactly
      </div>
    </div>
  );
};
