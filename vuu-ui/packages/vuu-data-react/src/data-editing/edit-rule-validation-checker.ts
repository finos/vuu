import type {
  DataValueDescriptor,
  DataValueValidationChecker,
  DataValueValidationResult,
  EditRuleValidationSuccessResult,
  EditValidationRule,
} from "@finos/vuu-data-types";
import type { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { getEditRuleValidator, isTypeDescriptor } from "@finos/vuu-utils";

export const OK: EditRuleValidationSuccessResult = { ok: true };

const NO_VALIDATION_RULES: EditValidationRule[] = [] as const;

export function getEditValidationRules(
  descriptor: DataValueDescriptor,
  apply: "change" | "commit",
) {
  if (isTypeDescriptor(descriptor.type)) {
    return (
      descriptor.type.rules?.filter(({ apply: a = "commit" }) => a === apply) ??
      NO_VALIDATION_RULES
    );
  }

  return NO_VALIDATION_RULES;
}

export const buildValidationChecker =
  (rules: EditValidationRule[]): DataValueValidationChecker =>
  (value?: VuuRowDataItemType) =>
    applyRules(rules, value);

function applyRules(rules: EditValidationRule[], value?: VuuRowDataItemType) {
  const result: { ok: boolean; messages?: string[] } = { ok: true };
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
  return result as DataValueValidationResult;
}
