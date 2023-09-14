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
import type { KeyBinding } from "@codemirror/view";
import {
  drawSelection,
  EditorView,
  highlightSpecialChars,
  keymap,
} from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import { Tree } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";

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
export { drawSelection, EditorView, highlightSpecialChars, KeyBinding, keymap };
// Lezer tags
export { styleTags, tags };
// Lezer commons
export { SyntaxNode, Tree };

export * from "./codemirror-basic-setup";
export * from "./parser-utils";
export * from "./suggestion-utils";
