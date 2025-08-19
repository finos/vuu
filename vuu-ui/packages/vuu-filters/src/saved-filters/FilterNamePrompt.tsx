import { FormField, FormFieldLabel } from "@salt-ds/core";
import { Prompt, PromptProps, VuuInput } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import {
  ChangeEventHandler,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import cx from "clsx";

export interface FilterNamePromptProps
  extends Pick<PromptProps, "onClose" | "open" | "title">,
    Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  filterName?: string;
  onConfirm: (filterName: string) => void;
}

const isValidName = (name: unknown): name is string =>
  typeof name === "string" && name.trim().length > 0;

export const FilterNamePrompt = ({
  className,
  filterName = "",
  onClose,
  onConfirm,
  open = true,
  title,
  ...htmlAttributes
}: FilterNamePromptProps) => {
  const filterNameRef = useRef(filterName);
  const [isValid, setIsValid] = useState(filterName !== "");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = useCallback(() => {
    onConfirm(filterNameRef.current);
  }, [onConfirm]);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const value = e.target.value;
      filterNameRef.current = value;
      setIsValid(isValidName(value));
    },
    [],
  );

  const handleCommit = useCallback<CommitHandler>(
    (e, value) => {
      if (isValidName(value)) {
        onConfirm(value);
      }
    },
    [onConfirm],
  );

  const confirmButtonProps = useMemo(
    () => ({
      disabled: !isValid,
      ref: confirmRef,
    }),
    [isValid],
  );

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  }, []);

  return (
    <Prompt
      {...htmlAttributes}
      className={cx("vuuFilterNamePrompt", className)}
      confirmButtonProps={confirmButtonProps}
      onClose={onClose}
      onConfirm={handleConfirm}
      open={open}
      title={title}
    >
      <FormField>
        <FormFieldLabel>Filter name</FormFieldLabel>
        <VuuInput
          commitOnBlur={false}
          inputRef={inputRef}
          onChange={handleChange}
          onCommit={handleCommit}
          defaultValue={filterNameRef.current}
          placeholder="Please enter"
        />
      </FormField>
    </Prompt>
  );
};
