import {
  LanguageSupport,
  LRLanguage,
  styleTags,
  tags as tag,
} from "@finos/vuu-codemirror";
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
