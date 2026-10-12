import { Button } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { vuuThemeSummary } from "../../theme-browser/theme-summary";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import { RouteLink } from "../chrome/RouteLink";
import { useRecent } from "../tree-nav/nav-store";
import type { NavNodeData } from "../tree-nav/nav-tree";
import {
  type AddedPageRef,
  createPageIndex,
  getHomeStats,
  getRecentlyAdded,
  type PageRef,
  resolveRecent,
} from "./home-model";

import "./HomePage.css";

const classBase = "ShowcaseHome";

const MAX_RECENT = 6;
const MAX_ADDED = 3;

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const LiveDot = () => (
  <span className="ShowcaseLiveDot" title="Uses live data" />
);

const PageList = ({
  icon,
  pages,
}: {
  icon: ChromeIconName;
  pages: (PageRef & Partial<Pick<AddedPageRef, "added">>)[];
}) => (
  <ul className={`${classBase}-pages`}>
    {pages.map(({ added, label, live, path, trail }) => (
      <li key={path}>
        <RouteLink className={`${classBase}-page`} path={path}>
          <ChromeIcon name={icon} size={14} />
          <span className={`${classBase}-pageText`}>
            <span className={`${classBase}-pageLabel`}>
              {label}
              {live ? <LiveDot /> : null}
            </span>
            {trail.length ? (
              <span className={`${classBase}-pageTrail`}>
                {trail.join(" › ")}
              </span>
            ) : null}
          </span>
          {added ? (
            <time className={`${classBase}-pageDate`} dateTime={added}>
              {formatDate(added)}
            </time>
          ) : null}
        </RouteLink>
      </li>
    ))}
  </ul>
);

export interface HomePageProps {
  onSearch?: () => void;
  treeSource: TreeSourceNode[];
}

export const HomePage = ({ onSearch, treeSource }: HomePageProps) => {
  const source = treeSource as TreeSourceNode<NavNodeData>[];
  const { addedPages, pageIndex, stats } = useMemo(
    () => ({
      addedPages: getRecentlyAdded(source, MAX_ADDED),
      pageIndex: createPageIndex(source),
      stats: getHomeStats(source),
    }),
    [source],
  );

  const recent = useRecent();
  const recentPages = useMemo(
    () => resolveRecent(recent, pageIndex).slice(0, MAX_RECENT),
    [pageIndex, recent],
  );

  return (
    <div className={classBase}>
      <section className={`${classBase}-hero`}>
        <h1 className={`${classBase}-title`}>Vuu Showcase</h1>
        <div className={`${classBase}-pitch`}>
          <p>
            Develop and test Vuu components in isolation. Every example renders
            standalone. Examples can be used as fixtures for Playwright
            component tests.
          </p>
          <p>Patterns illustrate component usage in varied scenarios.</p>
          <p>
            Inspect components under multiple themes, switch theme densities and
            mode.
          </p>
        </div>
        <Button
          appearance="bordered"
          className={`${classBase}-search`}
          onClick={onSearch}
        >
          <ChromeIcon name="search" size={18} />
          <span className={`${classBase}-searchLabel`}>
            Search {stats.examples} examples
          </span>
          <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
          <kbd>K</kbd>
        </Button>
        <dl className={`${classBase}-stats`}>
          <div>
            <dt>examples</dt>
            <dd>{stats.examples}</dd>
          </div>
          <div>
            <dt>live-data examples</dt>
            <dd>{stats.liveExamples}</dd>
          </div>
          <div>
            <dt>
              {stats.docChapters === 1 ? "guide chapter" : "guide chapters"}
            </dt>
            <dd>{stats.docChapters}</dd>
          </div>
          {vuuThemeSummary ? (
            <div>
              <dt>theme tokens</dt>
              <dd>{vuuThemeSummary.tokenCount}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {recentPages.length > 0 ? (
        <section
          aria-labelledby={`${classBase}-recent`}
          className={`${classBase}-section`}
        >
          <h2 className={`${classBase}-heading`} id={`${classBase}-recent`}>
            Recently viewed
          </h2>
          <PageList icon="clock" pages={recentPages} />
        </section>
      ) : null}

      {addedPages.length > 0 ? (
        <section
          aria-labelledby={`${classBase}-added`}
          className={`${classBase}-section`}
        >
          <h2 className={`${classBase}-heading`} id={`${classBase}-added`}>
            What&apos;s new
          </h2>
          <PageList icon="star" pages={addedPages} />
        </section>
      ) : null}
    </div>
  );
};
