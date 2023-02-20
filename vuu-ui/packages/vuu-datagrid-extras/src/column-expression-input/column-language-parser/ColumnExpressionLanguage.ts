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
