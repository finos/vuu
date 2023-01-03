import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { styleTags, tags as tag } from "@lezer/highlight";
import { parser } from "./generated/filter-parser";

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
  return new LanguageSupport(filterLanguage);
};
