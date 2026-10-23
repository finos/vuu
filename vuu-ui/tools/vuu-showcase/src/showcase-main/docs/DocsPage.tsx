import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import {
  type ComponentType,
  Fragment,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@salt-ds/core";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { mdxComponents, scrollToHeading } from "../../mdx-components";
import { findTreeNode, isComponentDescriptor } from "../../shared-utils";
import { createSlugger } from "../../slugify";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { getBreadcrumbs } from "../example/example-model";
import { standaloneDocUrl, standaloneUrl } from "../example/preview-state";
import { useShowcaseContext } from "../ShowcaseProvider";
import { navFromState, type NavNodeData } from "../tree-nav/nav-tree";
import {
  DocsContext,
  type DocsContextValue,
  useDocsContext,
} from "./DocsContext";
import { DocsToc, readTocEntries, type TocEntry } from "./DocsToc";
import {
  documentLabel,
  formatLastUpdated,
  getDocNeighbours,
  isDocumentNode,
  readingMinutes,
} from "./docs-model";

import "./DocsPage.css";

type NavNode = TreeSourceNode<NavNodeData>;

const classBase = "ShowcaseDocsPage";

const anchorParam = (anchor?: string) =>
  anchor ? `?anchor=${encodeURIComponent(anchor)}` : "";

const isUnmodifiedClick = (e: MouseEvent) =>
  !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0;

interface PageLinkProps {
  children: ReactNode;
  className?: string;
  route: string;
}

const PageLink = ({ children, className, route }: PageLinkProps) => {
  const { hrefForRoute, navigateTo } = useDocsContext();
  return (
    <a
      className={className}
      href={hrefForRoute(route)}
      onClick={(e) => {
        if (isUnmodifiedClick(e)) {
          e.preventDefault();
          navigateTo(route);
        }
      }}
    >
      {children}
    </a>
  );
};

/**
 * Links from a document. In the shell, routes are navigated client side. A
 * standalone document (one opened in its own window) navigates to other
 * documents in the same window, other routes open standalone if they can.
 */
const useDocumentLinks = (
  treeSource: NavNode[],
  standalone: boolean,
  docRoute: string,
) => {
  const navigate = useNavigate();
  const { preview } = useShowcaseContext();
  const hrefForRoute = useCallback(
    (route: string, anchor?: string) => {
      if (!standalone) {
        return `${route}${anchorParam(anchor)}`;
      }
      const node = findTreeNode(route, treeSource);
      return isDocumentNode(node)
        ? standaloneDocUrl(route, preview, anchor)
        : isComponentDescriptor(node?.nodeData)
          ? standaloneUrl(route, preview, anchor)
          : route;
    },
    [preview, standalone, treeSource],
  );
  const navigateTo = useCallback(
    (route: string, anchor?: string) => {
      const href = hrefForRoute(route, anchor);
      const isDocument = isDocumentNode(findTreeNode(route, treeSource));
      if (standalone && !isDocument) {
        window.location.assign(href);
      } else if (isDocument) {
        navigate(href);
      } else {
        navigate(href, { state: navFromState(docRoute) });
      }
    },
    [docRoute, hrefForRoute, navigate, standalone, treeSource],
  );
  return useMemo(
    () => ({ hrefForRoute, navigateTo }),
    [hrefForRoute, navigateTo],
  );
};

interface EmbeddedExampleEntry {
  name: string;
  route: string;
}

interface PageOutline {
  examples: EmbeddedExampleEntry[];
  minutes: number;
  toc: TocEntry[];
}

const EMPTY_OUTLINE: PageOutline = { examples: [], minutes: 0, toc: [] };

/** repeated headings get unique ids, as in the docs search index */
const assignUniqueHeadingIds = (article: HTMLElement) => {
  const headingId = createSlugger();
  article.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => {
    heading.id = headingId(heading.textContent ?? "");
  });
};

const readOutline = (article: HTMLElement): PageOutline => ({
  examples: Array.from(
    article.querySelectorAll<HTMLElement>("[data-embedded-example]"),
  ).map((el) => ({
    name: el.dataset.embeddedExample ?? "",
    route: el.dataset.route ?? "",
  })),
  minutes: readingMinutes(article.textContent ?? ""),
  toc: readTocEntries(article),
});

type MdxContent = ComponentType<{ components?: typeof mdxComponents }>;

export interface DocsPageProps {
  /** document opened in its own window, see DocsStandalone */
  standalone?: boolean;
  treeNode: NavNode;
  treeSource: NavNode[];
}

/**
 * An mdx document, rendered in the showcase chrome. Examples within the
 * document render in iframes, styled by the preview theme.
 */
export const DocsPage = ({
  standalone = false,
  treeNode,
  treeSource,
}: DocsPageProps) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const anchor = searchParams.get("anchor") ?? undefined;
  const { importExhibit, preview } = useShowcaseContext();
  const { label, nodeData } = treeNode;
  const documentPath = nodeData?.path;
  const docRoute = `/${treeNode.id}`;

  const scrollRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [content, setContent] = useState<{
    Content: MdxContent;
    path: string;
  }>();
  const [error, setError] = useState<string>();
  const [outline, setOutline] = useState<PageOutline>(EMPTY_OUTLINE);

  const links = useDocumentLinks(treeSource, standalone, docRoute);
  const docsContext = useMemo<DocsContextValue>(
    () => ({ docRoute, documentPath, ...links }),
    [docRoute, documentPath, links],
  );

  useEffect(() => {
    if (!documentPath) return;
    let cancelled = false;
    setError(undefined);
    importExhibit(documentPath).then(
      (module) => {
        if (!cancelled) {
          setContent({
            Content: module.default as MdxContent,
            path: documentPath,
          });
        }
      },
      (err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [documentPath, importExhibit]);

  const Content = content?.path === documentPath ? content?.Content : undefined;

  useLayoutEffect(() => {
    const article = articleRef.current;
    if (article && Content) {
      assignUniqueHeadingIds(article);
    }
    setOutline(article && Content ? readOutline(article) : EMPTY_OUTLINE);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [Content]);

  useEffect(() => {
    if (Content && anchor) {
      scrollToHeading(anchor);
      // embedded examples resize as they load, which can move the heading
      const timer = setTimeout(() => scrollToHeading(anchor), 400);
      return () => clearTimeout(timer);
    }
  }, [Content, anchor]);

  const crumbs = useMemo(
    () => getBreadcrumbs(pathname, treeSource),
    [pathname, treeSource],
  );
  const { next, previous } = useMemo(
    () => getDocNeighbours(docRoute, treeSource),
    [docRoute, treeSource],
  );
  const lastUpdated = nodeData?.lastUpdated;

  const scrollToExample = (name: string) =>
    articleRef.current
      ?.querySelector(`[data-embedded-example="${CSS.escape(name)}"]`)
      ?.closest(".ShowcaseLivePreview, .ShowcaseEmbeddedExample")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <DocsContext.Provider value={docsContext}>
      <div className={classBase}>
        <div className={`${classBase}-scroll`} ref={scrollRef}>
          <div className={`${classBase}-column`}>
            <div className={`${classBase}-header`}>
              <nav
                aria-label="Breadcrumb"
                className={`${classBase}-breadcrumb`}
              >
                {crumbs.map(({ label, path }) => (
                  <Fragment key={path}>
                    <PageLink className={`${classBase}-crumb`} route={path}>
                      {label}
                    </PageLink>
                    <ChromeIcon name="chevron-right" size={12} />
                  </Fragment>
                ))}
                <span aria-current="page" className={`${classBase}-crumb`}>
                  {label}
                </span>
              </nav>
              {outline.minutes > 0 ? (
                <span className={`${classBase}-readTime`}>
                  {outline.minutes} min read
                </span>
              ) : null}
              {standalone ? null : (
                <Button
                  appearance="transparent"
                  aria-label="Open in new window"
                  className={`${classBase}-openWindow`}
                  onClick={() =>
                    window.open(
                      standaloneDocUrl(docRoute, preview),
                      "_blank",
                      "noreferrer",
                    )
                  }
                  title="Open in new window"
                >
                  <ChromeIcon name="external" size={14} />
                </Button>
              )}
            </div>
            <article className="ShowcaseDocs" ref={articleRef}>
              {error ? (
                <p className={`${classBase}-error`}>
                  {`${label} could not be loaded: ${error}`}
                </p>
              ) : Content ? (
                <Content components={mdxComponents} />
              ) : null}
            </article>
            <footer className={`${classBase}-footer`}>
              {lastUpdated ? (
                <div className={`${classBase}-meta`}>
                  <span className={`${classBase}-updated`}>
                    Last updated {formatLastUpdated(lastUpdated)}
                  </span>
                </div>
              ) : null}
              {previous || next ? (
                <nav aria-label="Pages" className={`${classBase}-pager`}>
                  {previous ? (
                    <PageLink
                      className={`${classBase}-pagerCard ${classBase}-previous`}
                      route={`/${previous.id}`}
                    >
                      <span className={`${classBase}-pagerLabel`}>
                        Previous
                      </span>
                      <span className={`${classBase}-pagerTitle`}>
                        <ChromeIcon name="arrow-left" size={14} />
                        {documentLabel(previous)}
                      </span>
                    </PageLink>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <PageLink
                      className={`${classBase}-pagerCard ${classBase}-next`}
                      route={`/${next.id}`}
                    >
                      <span className={`${classBase}-pagerLabel`}>Next</span>
                      <span className={`${classBase}-pagerTitle`}>
                        {documentLabel(next)}
                        <ChromeIcon name="arrow-right" size={14} />
                      </span>
                    </PageLink>
                  ) : null}
                </nav>
              ) : null}
            </footer>
          </div>
        </div>
        <aside className={`${classBase}-rail ShowcaseDocsRail`}>
          <DocsToc entries={outline.toc} scrollRef={scrollRef} />
          {outline.examples.length > 0 ? (
            <section className="ShowcaseDocsRail-card">
              <div className="ShowcaseDocsRail-cardTitle">
                Examples on this page
              </div>
              <ul className="ShowcaseDocsRail-examples">
                {outline.examples.map(({ name, route }) => (
                  <li key={route}>
                    <a
                      href={links.hrefForRoute(route)}
                      onClick={(e) => {
                        if (isUnmodifiedClick(e)) {
                          e.preventDefault();
                          scrollToExample(name);
                        }
                      }}
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </DocsContext.Provider>
  );
};
