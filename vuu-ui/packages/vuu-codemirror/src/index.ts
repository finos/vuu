import {
  autocompletion,
  closeBrackets,
  Completion,
  CompletionContext,
  CompletionSource,
  startCompletion,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  defaultHighlightStyle,
  ensureSyntaxTree,
  HighlightStyle,
  LanguageSupport,
  LRLanguage,
  syntaxHighlighting,
  syntaxTree,
} from "@codemirror/language";
import { AnnotationType, EditorState, Extension } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightSpecialChars,
  keymap,
} from "@codemirror/view";
import { styleTags, tags } from "@lezer/highlight";
import { LRParser } from "@lezer/lr";

// Autocomplete
export { autocompletion, closeBrackets, startCompletion };
export type { Completion, CompletionContext, CompletionSource };
// Commands
export { defaultKeymap, history, historyKeymap };
// Language
export {
  defaultHighlightStyle,
  ensureSyntaxTree,
  HighlightStyle,
  LanguageSupport,
  LRLanguage,
  syntaxHighlighting,
  syntaxTree,
};
// State
export { AnnotationType, EditorState };
export type { Extension };
// View
export { drawSelection, EditorView, highlightSpecialChars, keymap };
// Lezer tags
export { styleTags, tags };
// Lezer lr
export { LRParser };

export * from "./parser-utils";
export * from "./suggestion-utils";
