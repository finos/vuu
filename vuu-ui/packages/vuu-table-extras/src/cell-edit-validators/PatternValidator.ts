import { EditRuleValidator, registerComponent } from "@finos/vuu-utils";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";

const isString = (value?: VuuRowDataItemType): value is string =>
  typeof value === "string";

const defaultMessage = "value does not match expected pattern";

export const PatternValidator: EditRuleValidator = (rule, value) => {
  if (typeof rule.value !== "string") {
    throw Error("Pattern validation rule must provide pattern");
  }
  if (isString(value)) {
    if (value === "") {
      return true;
    } else {
      const { message = defaultMessage } = rule;
      const pattern = new RegExp(rule.value);
      return pattern.test(value) || message;
    }
  } else {
    return "value must be a string";
  }
};

registerComponent("vuu-pattern", PatternValidator, "data-edit-validator", {});
