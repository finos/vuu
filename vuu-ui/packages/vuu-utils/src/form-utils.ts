import {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { KeyboardEvent, SyntheticEvent } from "react";
import { queryClosest } from "./html-utils";
import { isValidNumber } from "./data-utils";

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
 * @param throwIfUndefined
 */
export function getTypedValue(
  value: string,
  type: VuuColumnDataType,
  throwIfUndefined?: false,
): VuuRowDataItemType | undefined;
export function getTypedValue(
  value: string,
  type: VuuColumnDataType,
  throwIfUndefined: true,
): VuuRowDataItemType;
export function getTypedValue(
  value: string,
  type: VuuColumnDataType,
  throwIfUndefined = false,
): VuuRowDataItemType | undefined {
  switch (type) {
    case "int":
    case "long": {
      const typedValue = parseInt(value, 10);
      if (isValidNumber(typedValue)) {
        return typedValue;
      } else if (throwIfUndefined) {
        throw Error("SessionEditingForm getTypedValue");
      } else {
        return undefined;
      }
    }

    case "double": {
      const typedValue = parseFloat(value);
      if (isValidNumber(typedValue)) {
        return typedValue;
      }
      return undefined;
    }

    case "boolean":
      return value === "true" ? true : false;
    default:
      return value;
  }
}
