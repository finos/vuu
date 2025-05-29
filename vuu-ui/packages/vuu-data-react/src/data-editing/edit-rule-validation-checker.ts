import type {
  DataValueDescriptor,
  DataValueValidationChecker,
  DataValueValidationResult,
  EditPhase,
  EditRuleValidationSuccessResult,
  EditValidationRule,
} from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { getEditRuleValidator, isTypeDescriptor } from "@vuu-ui/vuu-utils";

export const OK: EditRuleValidationSuccessResult = { ok: true };

const NO_VALIDATION_RULES: EditValidationRule[] = [] as const;

export function getEditValidationRules(
  descriptor: DataValueDescriptor,
  editPhase: EditPhase | "*",
) {
  if (isTypeDescriptor(descriptor.type)) {
    return editPhase === "*"
      ? (descriptor.type.rules ?? [])
      : (descriptor.type.rules?.filter(
          ({ phase: a = "commit" }) => a === editPhase,
        ) ?? NO_VALIDATION_RULES);
  }

  return NO_VALIDATION_RULES;
}

export const buildValidationChecker =
  (rules: EditValidationRule[]): DataValueValidationChecker =>
  (value: VuuRowDataItemType | undefined, editPhase: EditPhase | "*") =>
    applyRules(rules, value, editPhase);

function applyRules(
  rules: EditValidationRule[],
  value?: VuuRowDataItemType,
  editPhase: EditPhase | "*" = "commit",
) {
  const result: { ok: boolean; messages?: string[] } = { ok: true };
  for (const rule of rules) {
    const { phase = "commit" } = rule;
    if (editPhase === "*" || phase === editPhase) {
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
  }
  return result as DataValueValidationResult;
}
