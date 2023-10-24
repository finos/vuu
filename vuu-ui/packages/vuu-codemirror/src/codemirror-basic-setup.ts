import { closeBrackets } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { Extension } from "@codemirror/state";
import {
  drawSelection,
  highlightSpecialChars,
  KeyBinding,
  keymap,
} from "@codemirror/view";

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
