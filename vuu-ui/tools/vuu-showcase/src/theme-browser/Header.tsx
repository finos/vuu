import type { ThemeToken } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import cx from "clsx";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { PRIMARY_AXES, TIER_INFO } from "./model-utils";
import { ThemeBrowserViewId, useThemeBrowser } from "./ThemeBrowserContext";
import type { ThemeSource } from "./theme-sources";
import { TokenPreview } from "./TokenPreview";

const VIEWS: [ThemeBrowserViewId, string][] = [
  ["tiers", "Tiers"],
  ["characteristic", "Characteristics"],
  ["foundations", "Foundations"],
  ["diagnostics", "Diagnostics"],
];

const SearchBox = () => {
  const { index, model, select } = useThemeBrowser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const results = open ? index.search(query) : [];

  useEffect(() => {
    const focusSearch = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const choose = (token: ThemeToken) => {
    select(token.name, "tiers");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      choose(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="search-container">
      <label className="search">
        <span className="search-icon">⌕</span>
        <input
          aria-label="Search tokens"
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${Object.keys(model.tokens).length} tokens`}
          ref={inputRef}
          value={query}
        />
        <kbd>⌘K</kbd>
      </label>
      {results.length ? (
        <ul className="search-results" role="listbox">
          {results.map((token, i) => (
            <li
              aria-selected={i === highlighted}
              className={cx({ highlighted: i === highlighted })}
              key={token.name}
              // mousedown, so selection happens before the input blurs
              onMouseDown={(e) => {
                e.preventDefault();
                choose(token);
              }}
              onMouseEnter={() => setHighlighted(i)}
              role="option"
            >
              <TokenPreview token={token} size="xs" />
              <span className="mono result-name">{token.name}</span>
              <span className="result-tier">
                <span className={cx("tier-mark xs", token.tier)} />
                {TIER_INFO[token.tier].label}
              </span>
            </li>
          ))}
        </ul>
      ) : open && query.trim() ? (
        <div className="search-results empty">No tokens match “{query}”</div>
      ) : null}
    </div>
  );
};

export interface HeaderProps {
  onChangeTheme: (id: string) => void;
  onChangeView: (view: ThemeBrowserViewId) => void;
  sourceId: string;
  sources: ThemeSource[];
  view: ThemeBrowserViewId;
}

export const Header = ({
  onChangeTheme,
  onChangeView,
  sourceId,
  sources,
  view,
}: HeaderProps) => {
  const { axes, model, setAxes } = useThemeBrowser();
  const issues = model.diagnostics.length;
  const axesShown = model.axes
    .filter((axis) => axis.values.length > 1)
    .sort(
      (a, b) =>
        (PRIMARY_AXES.indexOf(a.name) + 1 || 99) -
        (PRIMARY_AXES.indexOf(b.name) + 1 || 99),
    );

  return (
    <header className="app-header">
      <div className="title-row">
        <div className="brand">
          <span className="logo">
            <span />
            <span />
            <span />
          </span>
          <div>
            <div className="eyebrow">Vuu Showcase</div>
            <h1>Theme Browser</h1>
          </div>
        </div>
        <label className="theme-picker">
          <span className="theme-dot" />
          <select
            aria-label="Theme"
            onChange={(e) => onChangeTheme(e.target.value)}
            value={sourceId}
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
          <span className="muted">
            {Object.keys(model.tokens).length} tokens
          </span>
          <span className="chev">▾</span>
        </label>
        <nav className="tabs" role="tablist">
          {VIEWS.map(([id, label]) => (
            <button
              aria-selected={view === id}
              className={cx("tab", { selected: view === id })}
              key={id}
              onClick={() => onChangeView(id)}
              role="tab"
            >
              {label}
              {id === "diagnostics" && issues ? (
                <span className="badge warn">{issues}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <SearchBox />
      </div>
      <div className="axes-row">
        <span className="axes-title">Theme axes</span>
        {axesShown.map((axis) => (
          <div className="axis" key={axis.name}>
            <span className="axis-label">{axis.name.replace("-", " ")}</span>
            <div className="segmented" role="radiogroup" aria-label={axis.name}>
              {axis.values.map((value) => (
                <button
                  aria-checked={axes[axis.name] === value}
                  className={cx("seg", { selected: axes[axis.name] === value })}
                  key={value}
                  onClick={() => setAxes({ ...axes, [axis.name]: value })}
                  role="radio"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
        <span
          className="axes-note"
          title="The theme under observation is loaded into an isolated sandbox. Axes change the previews, never the browser itself."
        >
          <span className="isolation-note">
            <span className="lock">🔒</span>
            Subject theme is sandboxed
          </span>
        </span>
      </div>
    </header>
  );
};
