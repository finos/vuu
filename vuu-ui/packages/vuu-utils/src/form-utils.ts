import {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { KeyboardEvent, SyntheticEvent } from "react";
import { queryClosest } from "./html-utils";
import { stringIsValidDecimal, stringIsValidInt } from "./data-utils";
import { isValidTimeString } from "./date";

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

export const isNumber = (
  type: string,
  value: VuuRowDataItemType,
): value is number => type === "number";

export type CommitHandler<
  E extends HTMLElement = HTMLInputElement,
  T = VuuRowDataItemType,
> = (
  evt: SyntheticEvent<E> | KeyboardEvent<E>,
  value: T,
  source?: InputSource,
) => void;

/**
 * Convert a string value to the type appropriate for the associated
 * column or form field. Can be used when processing a string value
 * from an input used for user editing.
 *
 * @param value
 * @param type
 * @param throwIfInvalid
 */
export function getTypedValue(
  value: string,
  type: VuuColumnDataType | "number",
  throwIfInvalid?: false,
): VuuRowDataItemType | undefined;
export function getTypedValue(
  value: string,
  type: VuuColumnDataType | "number",
  throwIfInvalid: true,
): VuuRowDataItemType;
export function getTypedValue(
  value: string,
  type: VuuColumnDataType | "number",
  throwIfInvalid = false,
): VuuRowDataItemType | undefined {
  switch (type) {
    case "int":
    case "long": {
      if (stringIsValidInt(value)) {
        return parseInt(value, 10);
      } else if (isValidTimeString(value)) {  //TOCHECK
        return value;
      } else if (throwIfInvalid) {
        throw Error(`value ${value} is not a valid ${type}`);
      } else {
        return undefined;
      }
    }

    case "double":
    case "number": {
      if (stringIsValidDecimal(value)) {
        return parseFloat(value);
      } else if (throwIfInvalid) {
        throw Error(`value ${value} is not a valid ${type}`);
      } else {
        return undefined;
      }
    }

    case "boolean":
      return value === "true" ? true : false;
    default:
      return value;
  }
}
