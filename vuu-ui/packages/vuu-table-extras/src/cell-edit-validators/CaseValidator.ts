import { registerComponent } from "@finos/vuu-utils";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { EditRuleValidator } from "@finos/vuu-data-types";
import { OK } from "@finos/vuu-data-react";

const isString = (value?: VuuRowDataItemType): value is string =>
  typeof value === "string";

export const CaseValidator: EditRuleValidator = (rule, value) => {
  if (isString(value)) {
    if (value === "") {
      return OK;
    } else if (rule.value === "lower" && value.toLowerCase() !== value) {
      return { ok: false, message: "value must be all lowercase" };
    } else if (rule.value === "upper" && value.toUpperCase() !== value) {
      return { ok: false, message: "value must be all uppercase" };
    } else {
      return OK;
    }
  } else {
    return { ok: false, message: "value must be a string" };
  }
};

registerComponent("vuu-case", CaseValidator, "data-edit-validator", {});
