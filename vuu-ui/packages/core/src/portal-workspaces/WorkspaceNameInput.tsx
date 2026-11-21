import { type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";

export interface WorkspaceNameInputProps {
  "aria-label"?: string;
  className?: string;
  name: string;
  /** Escape, or a commit that leaves the name empty or unchanged. */
  onCancel: () => void;
  /** Enter or blur, with a trimmed, changed, non-empty name. */
  onCommit: (name: string) => void;
}

/** Edits a workspace name in place. Focuses and selects the name on mount. */
export const WorkspaceNameInput = ({
  "aria-label": ariaLabel = "Workspace name",
  className,
  name,
  onCancel,
  onCommit,
}: WorkspaceNameInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(name);
  const finished = useRef(false);

  useLayoutEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (commit: boolean) => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    const trimmed = value.trim();
    if (commit && trimmed !== "" && trimmed !== name) {
      onCommit(trimmed);
    } else {
      onCancel();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      // Don't let Escape also close the nav overlay or a popover.
      event.preventDefault();
      event.stopPropagation();
      finish(false);
    }
  };

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      onBlur={() => finish(true)}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={onKeyDown}
      ref={inputRef}
      spellCheck={false}
      type="text"
      value={value}
    />
  );
};
