import rehypeShiki from "@shikijs/rehype";
import remarkGfm from "remark-gfm";

// Code blocks are highlighted at build time. Both themes are emitted as
// CSS variables, the active one is selected in Showcase.css by theme mode.
export const mdxOptions = {
  remarkPlugins: [remarkGfm],
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
