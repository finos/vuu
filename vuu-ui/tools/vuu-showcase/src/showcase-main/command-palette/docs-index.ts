/** A section of an mdx document, indexed at build time for search */
export interface DocSearchEntry {
  /** showcase route of the document */
  route: string;
  /** id of the section heading, absent for the document introduction */
  anchor?: string;
  /** labels of the folders containing the document */
  breadcrumb: string[];
  /** document label, then the h2 and h3 headings of the section */
  title: string[];
  /** opening text of the section */
  text: string;
}

/** Url of the docs search index, served in dev and written by the build */
export const DOCS_INDEX_URL = "/showcase-search/docs.json";
