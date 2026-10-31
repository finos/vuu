import { Dialog, DialogContent, DialogHeader, Input } from "@salt-ds/core";
import cx from "clsx";
import { type KeyboardEvent, useMemo, useState } from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { useChromeModeContext } from "../chrome/ChromeModeContext";
import {
  filterWorkspaceExamples,
  type WorkspaceExample,
} from "./workspace-examples";

import "./ExamplePicker.css";

const classBase = "ShowcaseExamplePicker";
const MAX_RESULTS = 60;

export interface ExamplePickerProps {
  examples: WorkspaceExample[];
  onClose: () => void;
  onPick: (example: WorkspaceExample) => void;
  open: boolean;
}

const PickerBody = ({
  examples,
  onClose,
  onPick,
}: Omit<ExamplePickerProps, "open">) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(
    () => filterWorkspaceExamples(examples, query).slice(0, MAX_RESULTS),
    [examples, query],
  );
  const pick = (example?: WorkspaceExample) => {
    if (example) {
      onPick(example);
      onClose();
    }
  };
  const handleKeyDown = (evt: KeyboardEvent) => {
    if (evt.key === "ArrowDown") {
      evt.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (evt.key === "ArrowUp") {
      evt.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (evt.key === "Enter") {
      evt.preventDefault();
      pick(results[active]);
    }
  };
  return (
    <>
      <DialogHeader header="Add example" />
      <DialogContent className={`${classBase}-content`}>
        <Input
          autoFocus
          className={`${classBase}-input`}
          inputProps={{
            "aria-label": "Filter examples",
            onKeyDown: handleKeyDown,
          }}
          onChange={(evt) => {
            setQuery(evt.target.value);
            setActive(0);
          }}
          placeholder="Filter examples"
          startAdornment={<ChromeIcon name="search" size={14} />}
          value={query}
        />
        <ul
          aria-label="Examples"
          className={`${classBase}-list`}
          role="listbox"
        >
          {results.map((example, i) => (
            <li
              aria-selected={i === active}
              className={cx(`${classBase}-item`, {
                [`${classBase}-item-active`]: i === active,
              })}
              key={example.path}
              onClick={() => pick(example)}
              onMouseMove={() => setActive(i)}
              role="option"
            >
              <span className={`${classBase}-title`}>{example.title}</span>
              <span className={`${classBase}-folder`}>{example.folder}</span>
            </li>
          ))}
          {results.length === 0 ? (
            <li className={`${classBase}-empty`}>No matching examples</li>
          ) : null}
        </ul>
      </DialogContent>
    </>
  );
};

/** Choose an example to add to a workspace */
export const ExamplePicker = ({ open, ...props }: ExamplePickerProps) => {
  const { chromeMode } = useChromeModeContext();
  return (
    <Dialog
      className={`ShowcaseChrome ${classBase}`}
      data-chrome-mode={chromeMode}
      onOpenChange={(isOpen) => {
        if (!isOpen) props.onClose();
      }}
      open={open}
    >
      {open ? <PickerBody {...props} /> : null}
    </Dialog>
  );
};
