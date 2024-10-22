import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { SyntheticEvent } from "react";
import { queryClosest } from "./html-utils";

/**
 * Use with the following convention:
 *
 * <FormField data-field="my-field-name">
 */
export const getFieldName = (target: EventTarget | HTMLElement): string => {
  const saltFormField = queryClosest(target, "[data-field]") as HTMLElement;
  const fieldName = saltFormField?.dataset.field;
  if (fieldName) {
    return fieldName;
  } else {
    throw Error("named form field not found");
  }
};

export type InputSource = "typeahead-suggestion" | "text-input";

export type CommitHandler<
  E extends HTMLElement = HTMLInputElement,
  T extends VuuRowDataItemType | undefined = string,
> = (evt: SyntheticEvent<E>, value: T, source?: InputSource) => void;
