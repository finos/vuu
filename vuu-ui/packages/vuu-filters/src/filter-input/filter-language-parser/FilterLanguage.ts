import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./generated/filter-parser";
import { styleTags, tags as tag } from "@lezer/highlight";

const filterLanguage = LRLanguage.define({
  name: "VuuFilterQuery",
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: tag.variableName,
        String: tag.string,
        Or: tag.emphasis,
        Operator: tag.operator,
      }),
    ],
  }),
});

export const filterLanguageSupport = () => {
  return new LanguageSupport(filterLanguage /*, [exampleCompletion]*/);
};
