import rehypeShiki from "@shikijs/rehype";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { remarkAdmonitions } from "./remark-admonitions";
import { remarkMermaid } from "./remark-mermaid";

// Code blocks are highlighted at build time. Both themes are emitted as
// CSS variables, the active one is selected in Showcase.css by theme mode.
export const mdxOptions = {
  // Admonitions use the Docusaurus syntax, e.g :::note ... :::
  // Mermaid diagrams are fenced code blocks with the language "mermaid"
  remarkPlugins: [remarkGfm, remarkDirective, remarkAdmonitions, remarkMermaid],
  rehypePlugins: [
    [
      rehypeShiki,
      {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      },
    ],
  ],
};
