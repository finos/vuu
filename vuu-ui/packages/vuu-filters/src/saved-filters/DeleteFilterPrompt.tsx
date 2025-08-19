import { Prompt, PromptProps } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { FilterDescriptor } from "./useSavedFilterPanel";

export interface DeleteFilterPromptProps
  extends Pick<PromptProps, "onConfirm" | "onClose" | "open">,
    HTMLAttributes<HTMLDivElement> {
  filterDescriptor: FilterDescriptor;
}

export const DeleteFilterPrompt = ({
  children,
  className,
  filterDescriptor,
  onClose,
  onConfirm,
  open = true,
  ...htmlAttributes
}: DeleteFilterPromptProps) => {
  return (
    <Prompt
      {...htmlAttributes}
      className={cx("vuuDeleteFilterPrompt", className)}
      initialFocusedItem="confirm"
      onClose={onClose}
      onConfirm={onConfirm}
      open={open}
      title="Save Filter"
    >
      <span>{`Do you want to delete '${filterDescriptor.filter.name}' ?`}</span>
      {children}
    </Prompt>
  );
};
