import {
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Text,
} from "@salt-ds/core";
import { Prompt, PromptProps, VuuInput } from "@vuu-ui/vuu-ui-controls";
import { HTMLAttributes, useEffect, useRef } from "react";
import cx from "clsx";
import {
  FilterNamePromptHookProps,
  Status,
  useFilterNamePrompt,
} from "./useFilterNamePrompt";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import filterNamePromptCss from "./FilterNamePrompt.css";

const DUPLICATE_NAME_MESSAGE = "A filter with this name already exists";

export interface FilterNamePromptProps
  extends FilterNamePromptHookProps,
    Pick<PromptProps, "onClose" | "open" | "title">,
    Omit<HTMLAttributes<HTMLDivElement>, "title"> {}

export const FilterNamePrompt = ({
  className,
  filterName,
  onClose,
  onConfirm: onConfirmProp,
  open = true,
  title,
  inputProps,
  ...htmlAttributes
}: FilterNamePromptProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-saved-filter-panel",
    css: filterNamePromptCss,
    window: targetWindow,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    confirmButtonProps,
    nameOfDuplicateFilter,
    onChange,
    onCommit,
    onConfirm,
    status,
    value,
  } = useFilterNamePrompt({
    filterName,
    onConfirm: onConfirmProp,
  });

  const formFieldHelperText =
    status === Status.DuplicateName ? DUPLICATE_NAME_MESSAGE : undefined;

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
      onConfirm={onConfirm}
      open={open}
      title={title}
    >
      <FormField>
        <FormFieldLabel>Filter name</FormFieldLabel>
        <VuuInput
          commitOnBlur={false}
          inputRef={inputRef}
          onChange={onChange}
          onCommit={onCommit}
          defaultValue={value}
          placeholder="Please enter"
          inputProps={inputProps}
        />
        {formFieldHelperText ? (
          <FormFieldHelperText>{formFieldHelperText}</FormFieldHelperText>
        ) : null}
      </FormField>
      {nameOfDuplicateFilter ? (
        <Text color="warning">
          An identical filter has already been saved, see{" "}
          <b>{nameOfDuplicateFilter}</b>
        </Text>
      ) : null}
    </Prompt>
  );
};
