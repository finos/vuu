import {
  closeBrackets,
  defaultHighlightStyle,
  defaultKeymap,
  drawSelection,
  Extension,
  highlightSpecialChars,
  history,
  historyKeymap,
  keymap,
  syntaxHighlighting,
} from "@finos/vuu-codemirror";

export const minimalSetup: Extension = (() => [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  closeBrackets(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  keymap.of([...defaultKeymap, ...historyKeymap]),
])();
