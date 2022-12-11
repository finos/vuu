import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./generated/column-parser";
import { styleTags, tags as tag } from "@lezer/highlight";

const columnExpressionLanguage = LRLanguage.define({
  name: "VuuColumnExpression",
  parser: parser.configure({
    props: [
      styleTags({
        Function: tag.variableName,
        String: tag.string,
        Or: tag.emphasis,
        Operator: tag.operator,
      }),
    ],
  }),
});

export const columnExpressionLanguageSupport = () => {
  return new LanguageSupport(
    columnExpressionLanguage /*, [exampleCompletion]*/
  );
};
