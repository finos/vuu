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

/**
 * Unique heading ids within a document. Repeated headings are suffixed, as on
 * GitHub, e.g best-practices, best-practices-1. Only h2 and h3 have ids.
 */
export const createSlugger = () => {
  const counts = new Map<string, number>();
  return (text: string) => {
    const slug = slugify(text);
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    return count === 0 ? slug : `${slug}-${count}`;
  };
};
