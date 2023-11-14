import { EditRuleValidator, registerComponent } from "@finos/vuu-utils";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";

const isString = (value?: VuuRowDataItemType): value is string =>
  typeof value === "string";

export const CaseValidator: EditRuleValidator = (rule, value) => {
  if (isString(value)) {
    if (value === "") {
      return true;
    } else if (rule.value === "lower" && value.toLowerCase() !== value) {
      return "value must be all lowercase";
    } else if (rule.value === "upper" && value.toUpperCase() !== value) {
      return "value must be all uppercase";
    } else {
      return true;
    }
  } else {
    return "value must be a string";
  }
};

registerComponent("vuu-case", CaseValidator, "data-edit-validator", {});
