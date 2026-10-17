import type { ThemeToken } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import {
  Dropdown,
  Input,
  Option,
  Switch,
  Tab,
  TabList,
  TabTrigger,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import cx from "clsx";
import { KeyboardEvent, useRef, useState } from "react";
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
      <Input
        bordered
        className="search"
        inputProps={{
          "aria-label": "Search tokens",
          onBlur: () => setOpen(false),
          onFocus: () => setOpen(true),
          onKeyDown: handleKeyDown,
        }}
        inputRef={inputRef}
        onChange={(e) => {
          setQuery((e.target as HTMLInputElement).value);
          setHighlighted(0);
          setOpen(true);
        }}
        placeholder={`Search ${Object.keys(model.tokens).length} tokens`}
        startAdornment={<span className="search-icon">⌕</span>}
        value={query}
      />
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
  const {
    axes,
    components,
    model,
    selectedComponent,
    setAxes,
    setShowAllTokens,
    setShowComponents,
    showAllTokens,
    showComponents,
  } = useThemeBrowser();
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
        <div className="theme-picker">
          <Dropdown
            aria-label="Theme"
            bordered
            onSelectionChange={(_, [id]) => id && onChangeTheme(id)}
            selected={[sourceId]}
            startAdornment={<span className="theme-dot" />}
            value={
              sources.find((source) => source.id === sourceId)?.label ?? ""
            }
          >
            {sources.map((source) => (
              <Option key={source.id} value={source.id}>
                {source.label}
              </Option>
            ))}
          </Dropdown>
          <span className="muted">
            {Object.keys(model.tokens).length} tokens
          </span>
        </div>
        <Tabs
          onChange={(_, id) => onChangeView(id as ThemeBrowserViewId)}
          value={view}
        >
          <TabList appearance="transparent" className="tabs">
            {VIEWS.map(([id, label]) => (
              <Tab key={id} value={id}>
                <TabTrigger>
                  {label}
                  {id === "diagnostics" && issues ? (
                    <span className="badge warn">{issues}</span>
                  ) : null}
                </TabTrigger>
              </Tab>
            ))}
          </TabList>
        </Tabs>
        <SearchBox />
      </div>
      <div className="axes-row">
        <span className="axes-title">Theme axes</span>
        {axesShown.map((axis) => (
          <div className="axis" key={axis.name}>
            <span className="axis-label">{axis.name.replace("-", " ")}</span>
            <ToggleButtonGroup
              aria-label={axis.name}
              className="segmented"
              onChange={(e) =>
                setAxes({ ...axes, [axis.name]: e.currentTarget.value })
              }
              value={axes[axis.name]}
            >
              {axis.values.map((value) => (
                <ToggleButton className="seg" key={value} value={value}>
                  {value}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        ))}
        {components && view === "tiers" ? (
          <Switch
            checked={showComponents}
            className="components-switch"
            label={`Components (${components.size})`}
            onChange={(e) => setShowComponents(e.target.checked)}
          />
        ) : null}
        {showComponents && view === "tiers" ? (
          <Switch
            checked={showAllTokens}
            className="all-tokens-switch"
            disabled={!selectedComponent}
            label="Show all tokens"
            onChange={(e) => setShowAllTokens(e.target.checked)}
            title="With a component selected, show every theme token rather than only those the component references"
          />
        ) : null}
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
