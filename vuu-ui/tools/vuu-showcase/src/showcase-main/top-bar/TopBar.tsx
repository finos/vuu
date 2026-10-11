import cx from "clsx";
import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import type { ChromeMode } from "../chrome/chrome-settings";
import {
  DOCS_ID,
  sectionFromPath,
  type ShowcaseSection,
  THEME_PATH,
} from "../tree-nav/nav-tree";

import "./TopBar.css";

const classBase = "ShowcaseTopBar";

export const GITHUB_URL = "https://github.com/finos/vuu";

type SectionLink = {
  count?: number;
  icon: ChromeIconName;
  label: string;
  route: string;
  section: ShowcaseSection;
};

export interface TopBarProps {
  chromeMode: ChromeMode;
  exampleCount: number;
  onSearch?: () => void;
  onToggleChromeMode: () => void;
  version?: string;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const TopBar = ({
  chromeMode,
  exampleCount,
  onSearch,
  onToggleChromeMode,
  version,
}: TopBarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeSection = sectionFromPath(pathname);

  const sections: SectionLink[] = [
    { icon: "docs", label: "Docs", route: `/${DOCS_ID}`, section: "docs" },
    {
      count: exampleCount,
      icon: "examples",
      label: "Examples",
      route: "/",
      section: "examples",
    },
    { icon: "theme", label: "Theme", route: THEME_PATH, section: "theme" },
  ];

  const handleSectionClick = (evt: MouseEvent, route: string) => {
    if (!evt.metaKey && !evt.ctrlKey && !evt.shiftKey) {
      evt.preventDefault();
      navigate(route);
    }
  };

  const nextMode = chromeMode === "light" ? "dark" : "light";

  return (
    <header className={classBase}>
      <a
        className={`${classBase}-brand`}
        href="/"
        onClick={(evt) => handleSectionClick(evt, "/")}
      >
        <span aria-hidden className={`${classBase}-logo`}>
          V
        </span>
        <span className={`${classBase}-title`}>Vuu Showcase</span>
        {version ? (
          <span className={`${classBase}-version`}>v{version}</span>
        ) : null}
      </a>

      <nav aria-label="Sections" className={`${classBase}-sections`}>
        {sections.map(({ count, icon, label, route, section }) => (
          <a
            aria-current={activeSection === section ? "page" : undefined}
            className={cx(`${classBase}-section`, {
              [`${classBase}-section-active`]: activeSection === section,
            })}
            href={route}
            key={section}
            onClick={(evt) => handleSectionClick(evt, route)}
          >
            <ChromeIcon name={icon} />
            {label}
            {count !== undefined ? (
              <span className={`${classBase}-sectionCount`}>{count}</span>
            ) : null}
          </a>
        ))}
      </nav>

      <button
        className={`${classBase}-search`}
        onClick={onSearch}
        type="button"
      >
        <ChromeIcon name="search" />
        <span className={`${classBase}-searchLabel`}>
          Search examples, docs and tokens…
        </span>
        <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
        <kbd>K</kbd>
      </button>

      <button
        aria-label={`Switch to ${nextMode} appearance`}
        className={`${classBase}-iconButton`}
        data-chrome-mode-toggle
        onClick={onToggleChromeMode}
        title={`Switch to ${nextMode} appearance`}
        type="button"
      >
        <ChromeIcon name={chromeMode === "light" ? "sun" : "moon"} />
      </button>
      <a
        aria-label="Vuu on GitHub"
        className={`${classBase}-iconButton`}
        href={GITHUB_URL}
        rel="noreferrer"
        target="_blank"
        title="Vuu on GitHub"
      >
        <ChromeIcon name="github" />
      </a>
    </header>
  );
};
