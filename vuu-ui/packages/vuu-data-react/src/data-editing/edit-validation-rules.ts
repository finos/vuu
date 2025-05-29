import { registerComponent } from "@vuu-ui/vuu-utils";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EditRuleValidator } from "@vuu-ui/vuu-data-types";
import { OK } from "./edit-rule-validation-checker";

const isString = (value?: VuuRowDataItemType): value is string =>
  typeof value === "string";

const NUMERIC = /^(?:[0-9]|\.)+$/;

const CharValidatorNumeric: EditRuleValidator = (rule, value) => {
  if (isString(value)) {
    if (value.trim() === "") {
      return OK;
    } else if (value.match(NUMERIC)) {
      return OK;
    }
  }
  return { ok: false, message: "only numeric characters are permitted" };
};

const ValueValidatorInteger: EditRuleValidator = (rule, value) => {
  if (isString(value)) {
    if (value.trim() === "") {
      return OK;
    } else {
      if (!value.match(NUMERIC)) {
        return {
          ok: false,
          message: "value must be an integer, invalid character",
        };
      }
      if (parseFloat(value) === parseInt(value)) {
        return OK;
      }
    }
  }
  return { ok: false, message: "must be an integer value" };
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
