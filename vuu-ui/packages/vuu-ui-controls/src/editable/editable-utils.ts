import { EditValidationRule } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { getEditRuleValidator } from "@finos/vuu-utils";

export type ClientSideValidationChecker = (
  value?: VuuRowDataItemType
) => string | false | undefined;

export const buildValidationChecker =
  (rules: EditValidationRule[]): ClientSideValidationChecker =>
  (value?: VuuRowDataItemType) =>
    applyRules(rules, value);

function applyRules(
  rules: EditValidationRule[],
  value?: VuuRowDataItemType
): string | false | undefined {
  let result: false | string | undefined = undefined;
  for (const rule of rules) {
    const editRuleValidator = getEditRuleValidator(rule.name);
    if (editRuleValidator) {
      const ruleResult = editRuleValidator(rule, value);
      switch (ruleResult) {
        case true:
          break;
        case false:
          if (result === undefined) {
            result = false;
          }
          break;
        default:
          if (result === undefined || result === false) {
            result = ruleResult;
          } else {
            result += `::${ruleResult}`;
          }
      }
    } else {
      throw Error(
        `editable-utils applyRules, no validator registered for rule '${rule.name}'`
      );
    }
  }

  return result;
}
