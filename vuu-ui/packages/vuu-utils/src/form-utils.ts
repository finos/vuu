import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { SyntheticEvent } from "react";

/**
 * Use with the following convention:
 *
 * <FormField data-field="my-field-name">
 */
export const getFieldName = (
  input: HTMLInputElement | HTMLButtonElement,
): string => {
  const saltFormField = input.closest(".saltFormField") as HTMLElement;
  if (saltFormField && saltFormField.dataset.field) {
    const {
      dataset: { field },
    } = saltFormField;
    return field;
  } else {
    throw Error("named form field not found");
  }
};

export type CommitHandler<
  E extends HTMLElement = HTMLInputElement,
  T extends VuuRowDataItemType | undefined = string,
> = (evt: SyntheticEvent<E>, value: T) => void;
