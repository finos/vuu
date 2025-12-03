import { DataValueTypeSimple } from "@vuu-ui/vuu-data-types";
import {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { KeyboardEvent, SyntheticEvent } from "react";
import { stringIsValidDecimal, stringIsValidInt } from "./data-utils";
import { isValidTimeString, Time } from "./date";
import { queryClosest } from "./html-utils";
import { ExtendedFilterOptions } from "@vuu-ui/vuu-filter-types";

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

export const isValidRange = <T>([val1, val2]: [T, T]) => {
  if (isValidTimeString(val1) && isValidTimeString(val2)) {
    return val2 > val1;
  }
  return true;
};

/**
 * Convert a pair of string values to the type appropriate for the
 * associated column or form field. Can be used when processing a string value
 * from an input used for user editing.
 *
 */
export function getTypedRange(
  [value1, value2]: [string, string],
  dataType: VuuColumnDataType | DataValueTypeSimple,
  options?: ExtendedFilterOptions,
) {
  return [
    getTypedValue(value1, dataType, false, options),
    getTypedValue(value2, dataType, false, options),
  ];
}

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
  type: VuuColumnDataType | DataValueTypeSimple,
  throwIfInvalid?: false,
  options?: ExtendedFilterOptions,
): VuuRowDataItemType | undefined;
export function getTypedValue(
  value: string,
  type: VuuColumnDataType | DataValueTypeSimple,
  throwIfInvalid: true,
  options?: ExtendedFilterOptions,
): VuuRowDataItemType;
export function getTypedValue(
  value: string,
  type: VuuColumnDataType | DataValueTypeSimple,
  throwIfInvalid = false,
  options?: ExtendedFilterOptions,
): VuuRowDataItemType | undefined {
  switch (type) {
    case "int":
    case "long": {
      if (stringIsValidInt(value)) {
        return parseInt(value, 10);
      } else if (isValidTimeString(value)) {
        //TOCHECK
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

    case "time":
      if (isValidTimeString(value)) {
        // We don't manipulate the values of 'extended' filters, the
        // ExtendedFilter impementation will do that.
        if (options?.type === "TimeString") {
          return value;
        } else {
          return +Time(value).asDate();
        }
      } else if (throwIfInvalid) {
        throw Error(`value ${value} is not a valid ${type}`);
      } else {
        return undefined;
      }
    default:
      return value;
  }
}
