import {
  HighlightStyle,
  syntaxHighlighting,
  tags,
} from "@vuu-ui/vuu-codemirror";

const myHighlightStyle = HighlightStyle.define([
  {
    tag: tags.attributeValue,
    color: "var(--vuuFilterEditor-variableColor);font-weight: bold",
  },
  { tag: tags.variableName, color: "var(--vuuFilterEditor-variableColor)" },
  { tag: tags.comment, color: "green", fontStyle: "italic" },
]);

export const vuuHighlighting = syntaxHighlighting(myHighlightStyle);
