import { FilterContainerFilterDescriptor } from "@vuu-ui/vuu-filter-types";
import { Prompt, PromptProps } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { FilterDisplay } from "../filter-display/FilterDisplay";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export interface DeleteFilterPromptProps
  extends Pick<PromptProps, "onConfirm" | "onClose" | "open">,
    HTMLAttributes<HTMLDivElement> {
  columns?: ColumnDescriptor[];
  filterDescriptor: FilterContainerFilterDescriptor;
}

export const DeleteFilterPrompt = ({
  children,
  className,
  columns,
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
      title="Delete Filter"
    >
      <span>{`Do you want to delete '${filterDescriptor.filter?.name}' ?`}</span>
      {children ? (
        children
      ) : filterDescriptor.filter ? (
        <FilterDisplay columns={columns} filter={filterDescriptor.filter} />
      ) : null}
    </Prompt>
  );
};
