import { Button } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import { vuuThemeSummary } from "../../theme-browser/theme-summary";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { RouteLink } from "../chrome/RouteLink";
import { useRecent } from "../tree-nav/nav-store";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { areaArtVariant, FEATURED_AREA_COUNT, START_HERE } from "./home-config";
import { AreaArt, StartHereArtwork } from "./HomeArt";
import {
  createPageIndex,
  getAreas,
  getHomeStats,
  getStartHereCards,
  resolveRecent,
} from "./home-model";

import "./HomePage.css";

const classBase = "ShowcaseHome";

const MAX_RECENT = 6;

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

const LiveDot = () => (
  <span className="ShowcaseLiveDot" title="Uses live data" />
);

export interface HomePageProps {
  onSearch?: () => void;
  treeSource: TreeSourceNode[];
}

export const HomePage = ({ onSearch, treeSource }: HomePageProps) => {
  const source = treeSource as TreeSourceNode<NavNodeData>[];
  const { areas, pageIndex, startHere, stats } = useMemo(
    () => ({
      areas: getAreas(source),
      pageIndex: createPageIndex(source),
      startHere: getStartHereCards(START_HERE, source, vuuThemeSummary),
      stats: getHomeStats(source),
    }),
    [source],
  );
  const [showAllAreas, setShowAllAreas] = useState(false);
  const visibleAreas = showAllAreas
    ? areas
    : areas.slice(0, FEATURED_AREA_COUNT);

  const recent = useRecent();
  const recentPages = useMemo(
    () => resolveRecent(recent, pageIndex).slice(0, MAX_RECENT),
    [pageIndex, recent],
  );

  return (
    <div className={classBase}>
      <section className={`${classBase}-hero`}>
        <h1 className={`${classBase}-title`}>Build trading apps with Vuu</h1>
        <p className={`${classBase}-pitch`}>
          Interactive examples, guides and the design tokens behind every Vuu
          component. Pick a theme and density once – every example follows.
        </p>
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
          <ul className={`${classBase}-recent`}>
            {recentPages.map(({ label, live, path, trail }) => (
              <li key={path}>
                <RouteLink className={`${classBase}-recentItem`} path={path}>
                  <ChromeIcon name="clock" size={14} />
                  <span className={`${classBase}-recentText`}>
                    <span className={`${classBase}-recentLabel`}>
                      {label}
                      {live ? <LiveDot /> : null}
                    </span>
                    {trail.length ? (
                      <span className={`${classBase}-recentTrail`}>
                        {trail.join(" › ")}
                      </span>
                    ) : null}
                  </span>
                </RouteLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {startHere.length > 0 ? (
        <section
          aria-labelledby={`${classBase}-start`}
          className={`${classBase}-section`}
        >
          <h2 className={`${classBase}-heading`} id={`${classBase}-start`}>
            Start here
          </h2>
          <div className={`${classBase}-startHere`}>
            {startHere.map(({ art, description, path, title }) => (
              <RouteLink
                className={`${classBase}-card ${classBase}-featureCard`}
                key={path}
                path={path}
              >
                <div className={`${classBase}-thumb`}>
                  <StartHereArtwork art={art} />
                </div>
                <div className={`${classBase}-meta`}>
                  <span className={`${classBase}-metaText`}>
                    <span className={`${classBase}-cardTitle`}>{title}</span>
                    <span className={`${classBase}-cardDescription`}>
                      {description}
                    </span>
                  </span>
                  <ChromeIcon name="arrow-right" />
                </div>
              </RouteLink>
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby={`${classBase}-areas`}
        className={`${classBase}-section`}
      >
        <h2 className={`${classBase}-heading`} id={`${classBase}-areas`}>
          Browse by area
          {areas.length > FEATURED_AREA_COUNT ? (
            <Button
              appearance="transparent"
              aria-expanded={showAllAreas}
              className={`${classBase}-headingAction`}
              onClick={() => setShowAllAreas((show) => !show)}
              sentiment="accented"
            >
              {showAllAreas ? "Show fewer" : `All ${areas.length} areas`}
              <ChromeIcon name="arrow-right" size={14} />
            </Button>
          ) : null}
        </h2>
        <ul className={`${classBase}-areas`}>
          {visibleAreas.map(
            ({ count, id, label, liveCount, path, samples }) => (
              <li
                className={`${classBase}-card ${classBase}-areaCard`}
                key={id}
              >
                <div className={`${classBase}-thumb`}>
                  <AreaArt variant={areaArtVariant(id)} />
                </div>
                <div className={`${classBase}-meta`}>
                  <RouteLink className={`${classBase}-areaLink`} path={path}>
                    <span className={`${classBase}-cardTitle`}>{label}</span>
                  </RouteLink>
                  <span className={`${classBase}-cardDescription`}>
                    {plural(count, "example")}
                    {liveCount > 0 ? (
                      <span className={`${classBase}-live`}>
                        <LiveDot />
                        {liveCount} live
                      </span>
                    ) : null}
                  </span>
                  {samples.length ? (
                    <ul className={`${classBase}-samples`}>
                      {samples.map((sample) => (
                        <li key={sample.path}>
                          <RouteLink
                            className={`${classBase}-sample`}
                            path={sample.path}
                          >
                            {sample.label}
                          </RouteLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
};
