import { EditorView } from "@finos/vuu-codemirror";

export const vuuTheme = EditorView.theme(
  {
    "&": {
      color: "var(--vuuFilterEditor-color)",
      backgroundColor: "var(--vuuFilterEditor-background)",
      fontSize: "var(--vuuFilterEditor-fontSize)",
    },
    ".cm-content": {
      caretColor: "var(--vuuFilterEditor-cursorColor)",
      padding: 0,
    },
    ".cm-line": {
      lineHeight: "var(--vuuFilterEditor-lineHeight)",
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
      borderRadius: "4px",
      boxShadow: "var(--vuuFilterEditor-tooltipElevation)",
      "&.cm-tooltip-autocomplete > ul": {
        fontFamily: "var(--vuuFilterEditor-fontFamily)",
        fontSize: "var(--vuuFilterEditor-fontSize)",
        maxHeight: "240px",
      },
      "&.cm-tooltip-autocomplete > ul > li": {
        alignItems: "center",
        display: "flex",
        height: "var(--vuuFilterEditor-suggestion-height)",
        padding: "0 3px",
        lineHeight: "var(--vuuFilterEditor-suggestion-height)",
      },
      "&.cm-tooltip-autocomplete li[aria-selected]": {
        background: "var(--vuuFilterEditor-suggestion-selectedBackground)",
        color: "var(--vuuFilterEditor-suggestion-selectedColor)",
      },
    },
    ".cm-completionIcon": {
      height: "18px",
      flex: "0 0 16px",
    },
    ".cm-completionLabel": {
      flex: "1 1 auto",
    },
    ".cm-completionIcon-filter": {
      position: "relative",
      "&:after": {
        background: "var(--salt-text-secondary-foreground)",
        content: "''",
        "-webkit-mask": "var(--svg-filter) center center/13px 13px",
        "-webkit-mask-repeat": "no-repeat",
        position: "absolute",
        height: "18px",
        left: "0px",
        top: "0px",
        width: "16px",
      },
    },
  },
  { dark: false }
);
