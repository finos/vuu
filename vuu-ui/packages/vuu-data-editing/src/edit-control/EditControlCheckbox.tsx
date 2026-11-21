import { Checkbox } from "@salt-ds/core";
import type { CommitHandler } from "@vuu-ui/vuu-utils";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

export interface EditControlCheckboxProps {
  className?: string;
  onCommit: CommitHandler<HTMLElement>;
  value?: unknown;
}

const isChecked = (value: unknown) => value === true || value === "true";

/** A checkbox that commits its value each time it is toggled. */
export const EditControlCheckbox = ({
  className,
  onCommit,
  value,
}: EditControlCheckboxProps) => {
  const [checked, setChecked] = useState(isChecked(value));
  useEffect(() => {
    setChecked(isChecked(value));
  }, [value]);

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      setChecked(evt.target.checked);
      onCommit(evt, evt.target.checked);
    },
    [onCommit],
  );

  return (
    <Checkbox
      checked={checked}
      className={className}
      data-edit-control
      onChange={handleChange}
    />
  );
};
