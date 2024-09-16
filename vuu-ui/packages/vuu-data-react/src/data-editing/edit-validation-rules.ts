import { registerComponent } from "@finos/vuu-utils";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { EditRuleValidator } from "@finos/vuu-data-types";

const isString = (value?: VuuRowDataItemType): value is string =>
  typeof value === "string";

const NUMERIC = /^(?:[0-9]|\.)+$/;

const CharValidatorNumeric: EditRuleValidator = (rule, value) => {
  if (isString(value)) {
    if (value.trim() === "") {
      return true;
    } else if (value.match(NUMERIC)) {
      return true;
    }
  }
  return "only numeric characters are permitted";
};

const ValueValidatorInteger: EditRuleValidator = (rule, value) => {
  if (isString(value)) {
    if (value.trim() === "") {
      return true;
    } else {
      if (!value.match(NUMERIC)) {
        return "value must be an integer, invalid character";
      }
      if (parseFloat(value) === parseInt(value)) {
        return true;
      }
    }
  }
  return "must be an integer value";
};

export const registerRules = () => {
  registerComponent(
    "char-numeric",
    CharValidatorNumeric,
    "data-edit-validator",
    {},
  );
  registerComponent(
    "value-integer",
    ValueValidatorInteger,
    "data-edit-validator",
    {},
  );
};
