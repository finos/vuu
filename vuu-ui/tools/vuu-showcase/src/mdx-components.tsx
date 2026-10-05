import {
  Children,
  isValidElement,
  useEffect,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

const isExternalLink = (href = "") => /^[a-z]+:/i.test(href);

/**
 * Links between mdx documents are authored as relative file links, e.g
 * `./03-Formatting.mdx`, (the form expected by Docusaurus). In the Showcase,
 * mdx documents are rendered within an iframe, so we translate these to
 * Showcase routes and load them into the top level window.
 *
 * @param href the link as authored
 * @param baseUrl url of the folder containing the current document
 */
export const toShowcaseHref = (href: string, baseUrl: string) => {
  const [path, hash] = href.split("#");
  if (path.endsWith(".mdx")) {
    // Numeric ordering prefixes (e.g "02-") are not part of Showcase routes
    const route = path
      .replace(/\.mdx$/, "")
      .replace(/(^|\/)[Ii]ndex$/, "$1")
      .replace(/(^|\/)\d+-/g, "$1");
    const { pathname } = new URL(route || ".", baseUrl);
    // The url hash is used by the Showcase for theme settings, so
    // the target heading is passed as a query parameter instead.
    return `${pathname.replace(/\/$/, "")}${hash ? `?anchor=${hash}` : ""}`;
  }
  return href;
};

const textContent = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textContent(child.props.children)
          : "",
    )
    .join("");

/**
 * Generates a GitHub/Docusaurus compatible heading id
 */
export const slugify = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const scrollToHeading = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ block: "start" });

const createHeading = (Tag: "h2" | "h3") => {
  const Heading = ({ children, ...props }: HTMLAttributes<HTMLElement>) => {
    const id = slugify(textContent(children));
    useEffect(() => {
      if (new URLSearchParams(location.search).get("anchor") === id) {
        // allow live examples to render before scrolling
        setTimeout(() => scrollToHeading(id), 200);
      }
    }, [id]);
    return (
      <Tag {...props} id={id}>
        {children}
      </Tag>
    );
  };
  return Heading;
};

/**
 * @param documentPath path of the mdx document being rendered
 */
export const createMdxComponents = (documentPath: string) => {
  const { origin, pathname } = window.location;
  // An index document is rendered at the url of its containing folder
  const baseUrl = /(^|\/)[Ii]ndex\.mdx$/.test(documentPath)
    ? `${origin}${pathname.replace(/\/?$/, "/")}`
    : `${origin}${pathname}`;

  const MdxLink = ({
    href = "",
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      return (
        <a
          {...props}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            scrollToHeading(href.slice(1));
          }}
        />
      );
    } else if (isExternalLink(href)) {
      return <a {...props} href={href} rel="noreferrer" target="_blank" />;
    } else {
      return (
        <a {...props} href={toShowcaseHref(href, baseUrl)} target="_top" />
      );
    }
  };

  return { a: MdxLink, h2: createHeading("h2"), h3: createHeading("h3") };
};
