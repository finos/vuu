import {
  LanguageSupport,
  LRLanguage,
  styleTags,
  tags as tag,
} from "@finos/vuu-codemirror";
import { parser } from "./generated/column-parser";

const columnExpressionLanguage = LRLanguage.define({
  name: "VuuColumnExpression",
  parser: parser.configure({
    props: [
      styleTags({
        Column: tag.attributeValue,
        Function: tag.variableName,
        String: tag.string,
        Or: tag.emphasis,
        Operator: tag.operator,
      }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,
});

export const columnExpressionLanguageSupport = () => {
  return new LanguageSupport(
    columnExpressionLanguage /*, [exampleCompletion]*/
  );
};
