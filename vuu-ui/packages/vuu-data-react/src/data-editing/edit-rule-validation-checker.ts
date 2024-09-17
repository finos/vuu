import type {
  DataValueValidationChecker,
  DataValueValidationResult,
  EditRuleValidationSuccessResult,
  EditValidationRule,
} from "@finos/vuu-data-types";
import type { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { getEditRuleValidator } from "@finos/vuu-utils";

export const OK: EditRuleValidationSuccessResult = { ok: true };

export const buildValidationChecker =
  (rules: EditValidationRule[]): DataValueValidationChecker =>
  (value?: VuuRowDataItemType) =>
    applyRules(rules, value);

function applyRules(rules: EditValidationRule[], value?: VuuRowDataItemType) {
  const result: DataValueValidationResult = { ok: true };
  for (const rule of rules) {
    const applyRuleToValue = getEditRuleValidator(rule.name);
    if (applyRuleToValue) {
      const res = applyRuleToValue(rule, value);
      if (!res.ok) {
        result.ok = false;
        (result.messages ?? (result.messages = [])).push(res.message);
      }
    } else {
      throw Error(
        `editable-utils applyRules, no validator registered for rule '${rule.name}'`,
      );
    }
  }
  return result;
}
