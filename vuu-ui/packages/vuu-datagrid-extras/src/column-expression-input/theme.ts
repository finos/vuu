import { EditorView } from "@codemirror/view";

export const vuuTheme = EditorView.theme(
  {
    "&": {
      border: "solid 1px var(--salt-container-primary-borderColor)",
      color: "var(--vuuFilterEditor-color)",
      backgroundColor: "var(--vuuFilterEditor-background)",
    },
    ".cm-content": {
      caretColor: "var(--vuuFilterEditor-cursorColor)",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--vuuFilterEditor-cursorColor)",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--vuuFilterEditor-selectionBackground)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "var(--vuuFilterEditor-selectionBackground)",
    },
    ".cm-scroller": {
      fontFamily: "var(--vuuFilterEditor-fontFamily)",
    },
    ".cm-tooltip": {
      background: "var(--vuuFilterEditor-tooltipBackground)",
      border: "var(--vuuFilterEditor-tooltipBorder)",
      boxShadow: "var(--vuuFilterEditor-tooltipElevation)",
      "&.cm-tooltip-autocomplete > ul": {
        fontFamily: "var(--vuuFilterEditor-fontFamily)",
        fontSize: "var(--vuuFilterEditor-fontSize)",
        maxHeight: "240px",
      },
      "&.cm-tooltip-autocomplete > ul > li": {
        height: "var(--vuuFilterEditor-suggestion-height)",
        padding: "0 3px",
        lineHeight: "var(--vuuFilterEditor-suggestion-height)",
      },
      "&.cm-tooltip-autocomplete li[aria-selected]": {
        background: "var(--vuuFilterEditor-suggestion-selectedBackground)",
        color: "var(--vuuFilterEditor-suggestion-selectedColor)",
      },
      "&.cm-tooltip-autocomplete li .cm-completionDetail": {
        color: "var(--vuuFilterEditor-suggestion-detailColor)",
      },
    },
  },
  { dark: false }
);
