/**
 * Generates a GitHub/Docusaurus compatible heading id. Shared by the mdx
 * heading components and the build-time docs search index.
 */
export const slugify = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
