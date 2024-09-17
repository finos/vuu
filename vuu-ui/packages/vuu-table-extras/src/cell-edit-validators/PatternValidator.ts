import { registerComponent } from "@finos/vuu-utils";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { EditRuleValidator } from "@finos/vuu-data-types";
import { OK } from "@finos/vuu-data-react";

const isString = (value?: VuuRowDataItemType): value is string =>
  typeof value === "string";

const defaultMessage = "value does not match expected pattern";

export const PatternValidator: EditRuleValidator = (rule, value) => {
  if (typeof rule.value !== "string") {
    throw Error("Pattern validation rule must provide pattern");
  }
  if (isString(value)) {
    if (value === "") {
      return OK;
    } else {
      const { message = defaultMessage } = rule;
      const pattern = new RegExp(rule.value);
      if (pattern.test(value)) {
        return OK;
      } else {
        return { ok: false, message };
      }
    }
  } else {
    return { ok: false, message: "value must be a string" };
  }
};

registerComponent("vuu-pattern", PatternValidator, "data-edit-validator", {});
