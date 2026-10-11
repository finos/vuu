import rehypeShiki from "@shikijs/rehype";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { remarkAdmonitions } from "./remark-admonitions";
import { remarkEmbeddedExamples } from "./remark-embedded-examples";
import { remarkMermaid } from "./remark-mermaid";

// Code blocks are highlighted at build time. Both themes are emitted as
// CSS variables, the active one is selected in DocsPage.css by chrome mode.
export const mdxOptions = {
  // Admonitions use the Docusaurus syntax, e.g :::note ... :::
  // Mermaid diagrams are fenced code blocks with the language "mermaid"
  // Embedded examples are rendered in an iframe, see remark-embedded-examples
  remarkPlugins: [
    remarkGfm,
    remarkDirective,
    remarkAdmonitions,
    remarkMermaid,
    remarkEmbeddedExamples,
  ],
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
