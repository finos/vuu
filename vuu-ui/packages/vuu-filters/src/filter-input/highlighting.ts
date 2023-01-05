import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const myHighlightStyle = HighlightStyle.define([
  { tag: tags.variableName, color: "var(--vuuFilterEditor-variableColor)" },
  { tag: tags.comment, color: "green", fontStyle: "italic" },
]);

export const vuuHighlighting = syntaxHighlighting(myHighlightStyle);
