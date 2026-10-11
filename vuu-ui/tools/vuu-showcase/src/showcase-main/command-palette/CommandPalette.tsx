import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ChromeIcon } from "../chrome/ChromeIcon";
import type { ChromeMode } from "../chrome/chrome-settings";
import { standaloneUrl } from "../example/preview-state";
import { useShowcaseContext } from "../ShowcaseProvider";
import type { NavNodeData } from "../tree-nav/nav-tree";
import {
  excerpt,
  GROUP_LABELS,
  type PaletteGroup,
  type PaletteItem,
  type PaletteScope,
  SCOPES,
  searchPalette,
} from "./palette-model";
import { highlightText } from "./search-engine";
import { usePaletteCommands } from "./usePaletteCommands";
import { usePaletteData } from "./usePaletteData";

import "./CommandPalette.css";

const classBase = "ShowcaseCommandPalette";
const EMPTY_SCOPE_LIMIT = 50;

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);
const MOD_KEY = isMac ? "⌘" : "Ctrl";

export interface CommandPaletteProps {
  chromeMode: ChromeMode;
  onClose: () => void;
  onToggleChromeMode: () => void;
  open: boolean;
  treeSource: TreeSourceNode[];
}

const Highlighted = ({ query, text }: { query: string; text: string }) => (
  <>
    {highlightText(text, query).map(({ match, text }, i) =>
      match ? (
        <mark className={`${classBase}-match`} key={i}>
          {text}
        </mark>
      ) : (
        text
      ),
    )}
  </>
);

const ResultRow = ({
  active,
  id,
  item,
  onActivate,
  onSelect,
  query,
}: {
  active: boolean;
  id: string;
  item: PaletteItem;
  onActivate: () => void;
  onSelect: (newTab: boolean) => void;
  query: string;
}) => {
  const subtitle =
    item.subtitle ?? (item.text ? excerpt(item.text, query) : undefined);
  return (
    <li
      aria-selected={active}
      className={cx(`${classBase}-item`, {
        [`${classBase}-item-active`]: active,
      })}
      data-scope={item.scope}
      id={id}
      // mousedown is prevented, so focus stays in the input
      onMouseDown={(evt) => evt.preventDefault()}
      onClick={(evt: MouseEvent) => onSelect(evt.metaKey || evt.ctrlKey)}
      onMouseMove={active ? undefined : onActivate}
      role="option"
    >
      <span className={`${classBase}-itemIcon`}>
        {item.swatches ? (
          <span className={`${classBase}-swatches`}>
            {item.swatches.map((colour, i) => (
              <span key={i} style={{ background: colour }} />
            ))}
          </span>
        ) : (
          <ChromeIcon name={item.icon} />
        )}
      </span>
      <span className={`${classBase}-itemText`}>
        <span className={`${classBase}-itemTitle`}>
          {item.title.map((segment, i) => (
            <span key={i}>
              {i > 0 ? <span className={`${classBase}-sep`}>›</span> : null}
              <Highlighted query={query} text={segment} />
            </span>
          ))}
        </span>
        {subtitle ? (
          <span className={`${classBase}-itemSubtitle`}>
            {item.scope === "docs" ? (
              <Highlighted query={query} text={subtitle} />
            ) : (
              subtitle
            )}
          </span>
        ) : null}
      </span>
      {item.badge ? (
        <span
          className={cx(`${classBase}-badge`, {
            [`${classBase}-badge-live`]: item.badge.live,
          })}
        >
          {item.badge.live ? <ChromeIcon name="bolt" /> : null}
          {item.badge.label}
        </span>
      ) : null}
      {active ? <kbd className={`${classBase}-enter`}>↵</kbd> : null}
    </li>
  );
};

const PaletteBody = ({
  chromeMode,
  onClose,
  onToggleChromeMode,
  treeSource,
}: Omit<CommandPaletteProps, "open">) => {
  const navigate = useNavigate();
  const { preview } = useShowcaseContext();
  const commands = usePaletteCommands(chromeMode, onToggleChromeMode);
  const { indexes, items, loading, recent } = usePaletteData(
    treeSource as TreeSourceNode<NavNodeData>[],
    commands,
  );
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<PaletteScope>();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const hasQuery = query.trim() !== "";
  const results = useMemo(
    () => (hasQuery ? searchPalette(indexes, query, scope) : undefined),
    [hasQuery, indexes, query, scope],
  );
  const groups = useMemo<PaletteGroup[]>(() => {
    if (results) {
      return results.groups;
    } else if (scope) {
      return [{ id: scope, items: items[scope].slice(0, EMPTY_SCOPE_LIMIT) }];
    } else {
      return [
        { id: "recent" as const, items: recent },
        { id: "commands" as const, items: items.commands },
      ].filter((group) => group.items.length);
    }
  }, [items, recent, results, scope]);
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const active = Math.min(activeIndex, flatItems.length - 1);

  useEffect(() => setActiveIndex(0), [query, scope]);

  useLayoutEffect(() => {
    listRef.current
      ?.querySelector(`.${classBase}-item-active`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, groups]);

  const select = (item: PaletteItem | undefined, newTab: boolean) => {
    if (!item) return;
    onClose();
    if (item.run) {
      item.run();
    } else if (item.path && newTab) {
      if (item.scope === "tokens") {
        window.open(item.path, "_blank", "noopener");
      } else {
        const [pathname, search = ""] = item.path.split("?");
        const anchor = new URLSearchParams(search).get("anchor");
        window.open(
          standaloneUrl(pathname, preview, anchor),
          "_blank",
          "noopener",
        );
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const scopeCycle: (PaletteScope | undefined)[] = [
    undefined,
    ...SCOPES.map(({ scope }) => scope),
  ];

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    switch (evt.key) {
      case "ArrowDown":
        evt.preventDefault();
        setActiveIndex(Math.min(active + 1, flatItems.length - 1));
        break;
      case "ArrowUp":
        evt.preventDefault();
        setActiveIndex(Math.max(active - 1, 0));
        break;
      case "Enter":
        evt.preventDefault();
        select(flatItems[active], evt.metaKey || evt.ctrlKey);
        break;
      case "Tab": {
        evt.preventDefault();
        const i = scopeCycle.indexOf(scope);
        const step = evt.shiftKey ? -1 : 1;
        setScope(
          scopeCycle[(i + step + scopeCycle.length) % scopeCycle.length],
        );
        break;
      }
    }
  };

  const total = results
    ? Object.values(results.counts).reduce((sum, n) => sum + n, 0)
    : undefined;
  const chip = (
    id: PaletteScope | undefined,
    label: string,
    count?: number,
  ) => (
    <button
      aria-pressed={scope === id}
      className={`${classBase}-scope`}
      key={id ?? "all"}
      onClick={() => setScope(id)}
      onMouseDown={(evt) => evt.preventDefault()}
      tabIndex={-1}
      type="button"
    >
      {label}
      {count !== undefined ? (
        <span className={`${classBase}-scopeCount`}>{count}</span>
      ) : null}
    </button>
  );

  let rowIndex = 0;
  const activeId = flatItems[active]
    ? `${classBase}-option-${active}`
    : undefined;

  return (
    <>
      <div className={`${classBase}-header`}>
        <ChromeIcon name="search" />
        <input
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-controls={`${classBase}-results`}
          aria-expanded="true"
          aria-label="Search examples, docs, tokens and commands"
          autoFocus
          className={`${classBase}-input`}
          onChange={(evt) => setQuery(evt.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search examples, docs, tokens and commands…"
          role="combobox"
          spellCheck={false}
          value={query}
        />
        <button className={`${classBase}-esc`} onClick={onClose} type="button">
          esc
        </button>
      </div>
      <div className={`${classBase}-scopes`}>
        {chip(undefined, "All", total)}
        {SCOPES.map(({ label, scope: id }) =>
          chip(id, label, results?.counts[id]),
        )}
      </div>
      <ul
        className={`${classBase}-results`}
        id={`${classBase}-results`}
        ref={listRef}
        role="listbox"
      >
        {groups.map(({ id, items }) => (
          <li className={`${classBase}-group`} key={id} role="presentation">
            <div className={`${classBase}-groupLabel`} role="presentation">
              {GROUP_LABELS[id]}
            </div>
            <ul role="group" aria-label={GROUP_LABELS[id]}>
              {items.map((item) => {
                const index = rowIndex++;
                return (
                  <ResultRow
                    active={index === active}
                    id={`${classBase}-option-${index}`}
                    item={item}
                    key={item.key}
                    onActivate={() => setActiveIndex(index)}
                    onSelect={(newTab) => select(item, newTab)}
                    query={query}
                  />
                );
              })}
            </ul>
          </li>
        ))}
        {flatItems.length === 0 ? (
          <li className={`${classBase}-empty`} role="presentation">
            {loading && hasQuery
              ? "Loading search index…"
              : hasQuery
                ? `No results for “${query.trim()}”`
                : "Nothing here yet"}
          </li>
        ) : null}
      </ul>
      <div className={`${classBase}-footer`}>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> navigate
        </span>
        <span>
          <kbd>↵</kbd> open
        </span>
        <span>
          <kbd>{MOD_KEY}</kbd>
          <kbd>↵</kbd> open standalone
        </span>
        <span className={`${classBase}-footerEnd`}>
          <kbd>tab</kbd> next scope
        </span>
      </div>
    </>
  );
};

/**
 * Global search, a modal dialog opened with mod+K. The dialog is styled with
 * the showcase chrome tokens, it is never affected by the preview theme.
 */
export const CommandPalette = ({
  open,
  onClose,
  ...props
}: CommandPaletteProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-label="Search"
      className={`ShowcaseChrome ${classBase}`}
      data-chrome-mode={props.chromeMode}
      onClick={(evt) => {
        // a click on the dialog element itself is a click on the backdrop
        if (evt.target === dialogRef.current) onClose();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      {open ? <PaletteBody {...props} onClose={onClose} /> : null}
    </dialog>
  );
};
