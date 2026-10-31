import { Button, Link, ToggleButton } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { RouteLink } from "../chrome/RouteLink";
import { useTabbedDocuments } from "../doc-tabs/doc-tabs-store";
import { useShowcaseContext } from "../ShowcaseProvider";
import { favouritesStore, useFavourites } from "../tree-nav/nav-store";
import { getNavFromForPath, type NavNodeData } from "../tree-nav/nav-tree";
import {
  getAdjacentExamples,
  getBreadcrumbs,
  getSourceLinks,
  getTestFileLinks,
  routeOf,
} from "./example-model";
import { writePreviewParams } from "./preview-state";
import { SHOWCASE_SOURCE_ROOT } from "./source-root";

const classBase = "ShowcaseExampleHeader";

export interface ExampleHeaderProps {
  treeNode: TreeSourceNode<NavNodeData>;
  treeSource: TreeSourceNode<NavNodeData>[];
}

const fileName = (file: string) => file.split("/").pop() ?? file;

const FixtureNotice = ({ testFiles }: { testFiles: string[] }) => (
  <div className={`${classBase}-fixtures`}>
    <ChromeIcon name="flask" size={14} />
    <div>
      <p className={`${classBase}-fixturesText`}>
        This example is a fixture for{" "}
        {testFiles.length === 1
          ? "a Playwright test"
          : `${testFiles.length} Playwright test files`}
        . Changes to it may break these tests.
      </p>
      <ul className={`${classBase}-fixturesList`}>
        {testFiles.map((file) => {
          const { github, vscode } = getTestFileLinks(
            file,
            SHOWCASE_SOURCE_ROOT,
          );
          return (
            <li key={file}>
              <Link
                href={vscode ?? github}
                target={vscode ? undefined : "_blank"}
                title={file}
              >
                {fileName(file)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

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
  const { pathname, state: locationState } = useLocation();
  const navFrom = getNavFromForPath(locationState, pathname);
  const { nodeData = {} } = treeNode;
  const route = routeOf(treeNode);
  const favourites = useFavourites();
  const isFavourite = favourites.includes(route);
  const [copied, copyLink] = useCopyLink();
  const navigate = useNavigate();
  // once documents open in tabs, the tab names the example
  const compact = useTabbedDocuments();

  const crumbs = useMemo(
    () => getBreadcrumbs(pathname, treeSource, navFrom),
    [navFrom, pathname, treeSource],
  );
  const { next, previous } = useMemo(
    () => getAdjacentExamples(pathname, treeSource),
    [pathname, treeSource],
  );
  const sourceLinks = getSourceLinks(nodeData, SHOWCASE_SOURCE_ROOT);
  const isLive = nodeData.live || nodeData.tags?.includes("data-consumer");

  return (
    <header className={cx(classBase, { [`${classBase}-compact`]: compact })}>
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
          {nodeData.fixtureFor?.length ? (
            <span
              className={cx(`${classBase}-pill`, `${classBase}-pill-fixture`)}
            >
              <ChromeIcon name="flask" size={12} />
              Test fixture
            </span>
          ) : null}
        </div>
        {nodeData.description && !compact ? (
          <p className={`${classBase}-description`}>{nodeData.description}</p>
        ) : null}
        {nodeData.fixtureFor?.length && !compact ? (
          <FixtureNotice testFiles={nodeData.fixtureFor} />
        ) : null}
      </div>
      <div className={`${classBase}-actions`}>
        <Button
          appearance="bordered"
          aria-label={
            previous
              ? `Previous example, ${previous.label}`
              : "Previous example"
          }
          className={`${classBase}-iconButton`}
          disabled={!previous}
          onClick={() => previous && navigate(routeOf(previous))}
          title={previous ? `Previous: ${previous.label}` : undefined}
        >
          <ChromeIcon name="arrow-left" />
        </Button>
        <Button
          appearance="bordered"
          aria-label={next ? `Next example, ${next.label}` : "Next example"}
          className={`${classBase}-iconButton`}
          disabled={!next}
          onClick={() => next && navigate(routeOf(next))}
          title={next ? `Next: ${next.label}` : undefined}
        >
          <ChromeIcon name="arrow-right" />
        </Button>
        <ToggleButton
          onChange={() => favouritesStore.toggle(route)}
          selected={isFavourite}
          value="favourite"
        >
          <ChromeIcon
            name="star"
            fill={isFavourite ? "currentColor" : "none"}
          />
          Favourite
        </ToggleButton>
        <Button appearance="bordered" onClick={copyLink}>
          <ChromeIcon name={copied ? "check" : "link"} />
          {copied ? "Copied" : "Copy link"}
        </Button>
        {sourceLinks.vscode ? (
          <Button
            appearance="bordered"
            onClick={() => {
              if (sourceLinks.vscode) location.href = sourceLinks.vscode;
            }}
          >
            <ChromeIcon name="code" />
            Open in VS Code
          </Button>
        ) : sourceLinks.github ? (
          <Button
            appearance="bordered"
            onClick={() =>
              window.open(sourceLinks.github, "_blank", "noopener,noreferrer")
            }
          >
            <ChromeIcon name="github" />
            View on GitHub
          </Button>
        ) : null}
      </div>
    </header>
  );
};
