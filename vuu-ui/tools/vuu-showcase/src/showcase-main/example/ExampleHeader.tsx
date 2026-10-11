import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { RouteLink } from "../chrome/RouteLink";
import { useShowcaseContext } from "../ShowcaseProvider";
import { favouritesStore, useFavourites } from "../tree-nav/nav-store";
import type { NavNodeData } from "../tree-nav/nav-tree";
import {
  getAdjacentExamples,
  getBreadcrumbs,
  getSourceLinks,
  routeOf,
} from "./example-model";
import { writePreviewParams } from "./preview-state";
import { SHOWCASE_SOURCE_ROOT } from "./source-root";

const classBase = "ShowcaseExampleHeader";

export interface ExampleHeaderProps {
  treeNode: TreeSourceNode<NavNodeData>;
  treeSource: TreeSourceNode<NavNodeData>[];
}

const useCopyLink = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { preview } = useShowcaseContext();
  const [copied, setCopied] = useState(false);
  const copyLink = useCallback(() => {
    // all preview settings are written explicitly, so the link reproduces
    // exactly what this user sees, whatever the recipient's preferences
    const params = writePreviewParams(searchParams, preview);
    const url = `${location.origin}${pathname}?${params}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [pathname, preview, searchParams]);
  return [copied, copyLink] as const;
};

export const ExampleHeader = ({ treeNode, treeSource }: ExampleHeaderProps) => {
  const { pathname } = useLocation();
  const { nodeData = {} } = treeNode;
  const route = routeOf(treeNode);
  const favourites = useFavourites();
  const isFavourite = favourites.includes(route);
  const [copied, copyLink] = useCopyLink();

  const crumbs = useMemo(
    () => getBreadcrumbs(pathname, treeSource),
    [pathname, treeSource],
  );
  const { next, previous } = useMemo(
    () => getAdjacentExamples(pathname, treeSource),
    [pathname, treeSource],
  );
  const sourceLinks = getSourceLinks(nodeData, SHOWCASE_SOURCE_ROOT);
  const isLive = nodeData.live || nodeData.tags?.includes("data-consumer");

  return (
    <header className={classBase}>
      <div className={`${classBase}-main`}>
        <nav aria-label="Breadcrumb" className={`${classBase}-breadcrumb`}>
          {crumbs.map(({ label, path }, i) => (
            <Fragment key={path}>
              {i > 0 ? <ChromeIcon name="chevron-right" size={12} /> : null}
              <RouteLink className={`${classBase}-crumb`} path={path}>
                {label}
              </RouteLink>
            </Fragment>
          ))}
        </nav>
        <div className={`${classBase}-titleRow`}>
          <h1 className={`${classBase}-title`}>{treeNode.label}</h1>
          {isLive ? (
            <span className={cx(`${classBase}-pill`, `${classBase}-pill-live`)}>
              <ChromeIcon name="bolt" size={12} />
              Live data
            </span>
          ) : null}
        </div>
        {nodeData.description ? (
          <p className={`${classBase}-description`}>{nodeData.description}</p>
        ) : null}
      </div>
      <div className={`${classBase}-actions`}>
        {previous ? (
          <RouteLink
            aria-label={`Previous example, ${previous.label}`}
            className="ShowcaseButton ShowcaseIconButton"
            path={routeOf(previous)}
            title={`Previous: ${previous.label}`}
          >
            <ChromeIcon name="arrow-left" />
          </RouteLink>
        ) : (
          <button className="ShowcaseButton ShowcaseIconButton" disabled>
            <ChromeIcon name="arrow-left" />
          </button>
        )}
        {next ? (
          <RouteLink
            aria-label={`Next example, ${next.label}`}
            className="ShowcaseButton ShowcaseIconButton"
            path={routeOf(next)}
            title={`Next: ${next.label}`}
          >
            <ChromeIcon name="arrow-right" />
          </RouteLink>
        ) : (
          <button className="ShowcaseButton ShowcaseIconButton" disabled>
            <ChromeIcon name="arrow-right" />
          </button>
        )}
        <button
          aria-pressed={isFavourite}
          className={cx("ShowcaseButton", {
            "ShowcaseButton-active": isFavourite,
          })}
          onClick={() => favouritesStore.toggle(route)}
          type="button"
        >
          <ChromeIcon
            name="star"
            fill={isFavourite ? "currentColor" : "none"}
          />
          Favourite
        </button>
        <button className="ShowcaseButton" onClick={copyLink} type="button">
          <ChromeIcon name={copied ? "check" : "link"} />
          {copied ? "Copied" : "Copy link"}
        </button>
        {sourceLinks.vscode ? (
          <a className="ShowcaseButton" href={sourceLinks.vscode}>
            <ChromeIcon name="code" />
            Open in VS Code
          </a>
        ) : sourceLinks.github ? (
          <a
            className="ShowcaseButton"
            href={sourceLinks.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ChromeIcon name="github" />
            View on GitHub
          </a>
        ) : null}
      </div>
    </header>
  );
};
