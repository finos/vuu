import {
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

/// A minimal set of extensions to create a functional editor. Only
/// includes [the default keymap](#commands.defaultKeymap), [undo
/// history](#commands.history), [special character
/// highlighting](#view.highlightSpecialChars), [custom selection
/// drawing](#view.drawSelection), and [default highlight
/// style](#language.defaultHighlightStyle).
export const minimalSetup: Extension = (() => [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  keymap.of([...defaultKeymap, ...historyKeymap]),
])();

export { EditorView } from "@codemirror/view";
