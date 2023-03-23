import { KeyBinding } from "@codemirror/view";
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
} from "./index";

const keyBindings = [
  ...defaultKeymap,
  ...historyKeymap,
] as ReadonlyArray<KeyBinding>;

export const minimalSetup: Extension = (() => [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  keymap.of(keyBindings),
])();
