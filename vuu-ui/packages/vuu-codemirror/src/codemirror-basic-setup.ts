import { KeyBinding } from "@codemirror/view";
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
} from "./index";

const keyBindings = [
  ...defaultKeymap,
  ...historyKeymap,
] as ReadonlyArray<KeyBinding>;

export const minimalSetup: Extension = (() => [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  closeBrackets(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  keymap.of(keyBindings),
])();
