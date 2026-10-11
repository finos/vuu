import type {
  ThemeGroup,
  ThemeTier,
  ThemeToken,
} from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import cx from "clsx";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  displayValue,
  rampOf,
  shortName,
  TIER_INFO,
  TIERS,
  toHex,
} from "./model-utils";
import { TokenDetail } from "./TokenDetail";
import { TokenPreview } from "./TokenPreview";
import { useThemeBrowser } from "./ThemeBrowserContext";

/** [referenced token, referencing token, kind] */
type Edge = [string, string, "chain" | "fan"];

interface LineagePath {
  d: string;
  fan: boolean;
  ends: [number, number][];
}

interface LineageState {
  paths: LineagePath[];
  width: number;
  height: number;
  hidden: Partial<Record<ThemeTier, { above: number; below: number }>>;
}

const groupKey = (group: ThemeGroup) =>
  `${group.tier}/${group.layer}/${group.name}`;

const isRampGroup = (group: ThemeGroup, tokens: ThemeToken[]) =>
  group.tier === "foundations" && tokens.filter(rampOf).length > 20;

const MINI_STRIP_COUNT = 14;

const TokenRow = ({
  token,
  lineage,
}: {
  token: ThemeToken;
  lineage: boolean;
}) => {
  const { resolve, select, selected } = useThemeBrowser();
  const value = resolve(token.name);
  return (
    <div
      className={cx("token-row", {
        "in-lineage": lineage,
        selected: token.name === selected,
      })}
      data-token={token.name}
      onClick={() => select(token.name)}
      title={token.name}
    >
      <TokenPreview token={token} />
      <span className="token-name">{shortName(token)}</span>
      {value ? (
        <span className="token-value">{displayValue(token, value)}</span>
      ) : (
        <span
          className="chip warn"
          title="Resolves to nothing under these axes"
        >
          unresolved
        </span>
      )}
    </div>
  );
};

const Ramps = ({
  tokens,
  lineage,
}: {
  tokens: ThemeToken[];
  lineage: Set<string>;
}) => {
  const { resolve, select } = useThemeBrowser();
  const ramps = new Map<string, { step: number; token: ThemeToken }[]>();
  for (const token of tokens) {
    const ramp = rampOf(token);
    if (ramp) {
      const steps = ramps.get(ramp.hue) ?? [];
      steps.push({ step: ramp.step, token });
      ramps.set(ramp.hue, steps);
    }
  }
  return (
    <div className="ramps">
      {[...ramps.entries()].map(([hue, steps]) => (
        <div className="ramp" key={hue}>
          <span className="ramp-name">{hue}</span>
          <div className="ramp-cells">
            {steps
              .sort((a, b) => a.step - b.step)
              .map(({ step, token }) => (
                <span
                  className={cx("ramp-cell", {
                    "in-lineage": lineage.has(token.name),
                  })}
                  data-token={token.name}
                  key={step}
                  onClick={() => select(token.name)}
                  style={{ background: resolve(token.name) }}
                  title={`${token.name} ${toHex(resolve(token.name))}`}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface GroupSectionProps {
  expanded: boolean;
  group: ThemeGroup;
  lineage: Set<string>;
  onToggle: (key: string) => void;
  onShowAll: (key: string, showAll: boolean) => void;
  showAll: boolean;
}

const GroupSection = ({
  expanded,
  group,
  lineage,
  onShowAll,
  onToggle,
  showAll,
}: GroupSectionProps) => {
  const { index, resolve } = useThemeBrowser();
  const key = groupKey(group);
  const tokens = group.tokens.flatMap((n) => index.token(n) ?? []);
  const onPath = tokens.filter((t) => lineage.has(t.name));
  const all = showAll || onPath.length === 0;

  let body = null;
  if (expanded) {
    if (isRampGroup(group, tokens)) {
      const rest = tokens.filter((t) => !rampOf(t));
      const restShown = all ? rest : rest.filter((t) => lineage.has(t.name));
      body = (
        <div className="group-body">
          <Ramps tokens={tokens} lineage={lineage} />
          {restShown.map((t) => (
            <TokenRow key={t.name} token={t} lineage={lineage.has(t.name)} />
          ))}
          {restShown.length < rest.length ? (
            <button className="more-row" onClick={() => onShowAll(key, true)}>
              + {rest.length - restShown.length} more in {group.name}
            </button>
          ) : null}
        </div>
      );
    } else {
      const shown = all ? tokens : onPath;
      body = (
        <div className="group-body">
          {shown.map((t) => (
            <TokenRow key={t.name} token={t} lineage={lineage.has(t.name)} />
          ))}
          {shown.length < tokens.length ? (
            <button className="more-row" onClick={() => onShowAll(key, true)}>
              + {tokens.length - shown.length} more in {group.name}
            </button>
          ) : showAll && onPath.length > 0 && onPath.length < tokens.length ? (
            <button className="more-row" onClick={() => onShowAll(key, false)}>
              − show path only
            </button>
          ) : null}
        </div>
      );
    }
  }

  const colors = expanded
    ? []
    : tokens.filter((t) => t.category === "color").slice(0, MINI_STRIP_COUNT);

  return (
    <section
      className={cx("group", { expanded })}
      data-members={group.tokens.join(" ")}
    >
      <button
        aria-expanded={expanded}
        className="group-header"
        onClick={() => onToggle(key)}
      >
        <span className="twisty">{expanded ? "▾" : "▸"}</span>
        <span className="group-name">{group.name}</span>
        <span
          className={cx("chip", group.layer === "legacy" ? "legacy" : "subtle")}
        >
          {group.layer}
        </span>
        {onPath.length ? (
          <span className="chip accent">{onPath.length} in path</span>
        ) : null}
        <span className="group-count">{tokens.length}</span>
      </button>
      {colors.length ? (
        <div className="mini-strip">
          {colors.map((t) => (
            <span key={t.name} style={{ background: resolve(t.name) }} />
          ))}
        </div>
      ) : null}
      {body}
    </section>
  );
};

const LINEAGE_NONE: LineageState = {
  paths: [],
  width: 0,
  height: 0,
  hidden: {},
};

/**
 * Measures rendered token positions and computes the connecting curves. Edges
 * within a single tier are not drawn, nor are edges with an endpoint scrolled
 * out of view - those are counted instead.
 */
const measureLineage = (container: HTMLElement, edges: Edge[]) => {
  const box = container.getBoundingClientRect();
  const state: LineageState = {
    paths: [],
    width: box.width,
    height: box.height,
    hidden: {},
  };
  // a token in a collapsed group is anchored to its group header
  const find = (name: string) =>
    container.querySelector<HTMLElement>(
      `[data-token="${CSS.escape(name)}"]`,
    ) ??
    container.querySelector<HTMLElement>(
      `[data-members~="${CSS.escape(name)}"] > .group-header`,
    );
  const visibility = (el: HTMLElement) => {
    const scroller = el.closest(".tier-scroll")?.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    if (scroller && middle < scroller.top) return "above";
    if (scroller && middle > scroller.bottom) return "below";
    return "visible";
  };
  const tierOf = (el: HTMLElement) =>
    el.closest<HTMLElement>("[data-tier]")?.dataset.tier as ThemeTier;

  for (const [fromName, toName, kind] of edges) {
    const from = find(fromName);
    const to = find(toName);
    if (!from || !to) continue;
    const fromTier = tierOf(from);
    const toTier = tierOf(to);
    if (fromTier === toTier) continue;

    let skip = false;
    for (const [el, tier] of [
      [from, fromTier],
      [to, toTier],
    ] as const) {
      const v = visibility(el);
      if (v !== "visible") {
        const counts = (state.hidden[tier] ??= { above: 0, below: 0 });
        counts[v] += 1;
        skip = true;
      }
    }
    if (skip) continue;

    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const [left, right] = a.left <= b.left ? [a, b] : [b, a];
    const x1 = left.right - box.left;
    const y1 = left.top + left.height / 2 - box.top;
    const x2 = right.left - box.left;
    const y2 = right.top + right.height / 2 - box.top;
    const dx = Math.max(40, (x2 - x1) / 2);
    state.paths.push({
      d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
      fan: kind === "fan",
      ends: [
        [x1, y1],
        [x2, y2],
      ],
    });
  }
  return state;
};

/** scroll each column so the first token on the path is in view */
const scrollPathIntoView = (container: HTMLElement) => {
  for (const scroller of container.querySelectorAll<HTMLElement>(
    ".tier-scroll",
  )) {
    const target = scroller.querySelector<HTMLElement>(
      ".token-row.in-lineage, .ramp-cell.in-lineage",
    );
    if (!target) continue;
    const s = scroller.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (t.top < s.top + 32 || t.bottom > s.bottom) {
      scroller.scrollTop += t.top - s.top - scroller.clientHeight * 0.3;
    }
  }
};

export const TiersView = () => {
  const { axes, index, model, selected } = useThemeBrowser();
  const columnsRef = useRef<HTMLDivElement>(null);
  const [userExpanded, setUserExpanded] = useState<Set<string>>(new Set());
  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState<Set<string>>(new Set());
  const [lineageState, setLineageState] = useState(LINEAGE_NONE);
  const [prevSelected, setPrevSelected] = useState(selected);

  if (selected !== prevSelected) {
    // a new selection always reveals its path
    setPrevSelected(selected);
    setUserCollapsed(new Set());
  }

  const { edges, lineage } = useMemo(() => {
    if (!selected || !index.token(selected)) {
      return { edges: [] as Edge[], lineage: new Set<string>() };
    }
    const chain = index
      .chainOf(selected, axes)
      .flatMap((step) => step.token?.name ?? []);
    const edges: Edge[] = chain
      .slice(1)
      .map((name, i) => [name, chain[i], "chain"]);
    const consumers = index.token(selected)?.referencedBy ?? [];
    for (const consumer of consumers) {
      edges.push([selected, consumer, "fan"]);
    }
    return { edges, lineage: new Set([...chain, ...consumers]) };
  }, [axes, index, selected]);

  const isExpanded = (group: ThemeGroup) => {
    const key = groupKey(group);
    if (userCollapsed.has(key)) return false;
    return (
      userExpanded.has(key) || group.tokens.some((name) => lineage.has(name))
    );
  };

  const toggleGroup = (key: string) => {
    const group = TIERS.flatMap((tier) => model.groups[tier]).find(
      (g) => groupKey(g) === key,
    );
    if (!group) return;
    const expanded = isExpanded(group);
    const without = (set: Set<string>) =>
      new Set([...set].filter((k) => k !== key));
    const withKey = (set: Set<string>) => new Set(set).add(key);
    setUserExpanded(expanded ? without : withKey);
    setUserCollapsed(expanded ? withKey : without);
  };

  const handleShowAll = useCallback((key: string, value: boolean) => {
    setShowAll((set) => {
      const next = new Set(set);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const redraw = useCallback(() => {
    const container = columnsRef.current;
    if (container) {
      const next = measureLineage(container, edges);
      setLineageState((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    }
  }, [edges]);

  useLayoutEffect(() => {
    if (columnsRef.current) {
      scrollPathIntoView(columnsRef.current);
    }
  }, [selected]);

  useLayoutEffect(() => {
    redraw();
  });

  useLayoutEffect(() => {
    const container = columnsRef.current;
    if (!container) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(redraw);
    };
    container.addEventListener("scroll", schedule, true);
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", schedule, true);
      observer.disconnect();
    };
  }, [redraw]);

  return (
    <main className="tiers-view">
      <div className="columns" ref={columnsRef}>
        {TIERS.map((tier) => {
          const groups = model.groups[tier];
          const count = groups.reduce((n, g) => n + g.tokens.length, 0);
          const hidden = lineageState.hidden[tier];
          return (
            <div
              className={cx("tier", `tier-${tier}`)}
              data-tier={tier}
              key={tier}
            >
              <div className="tier-header">
                <div className="tier-title">
                  <span className={cx("tier-mark", tier)} />
                  <h2>{TIER_INFO[tier].label}</h2>
                  <span className="tier-count">{count}</span>
                </div>
                <p className="tier-blurb">{TIER_INFO[tier].blurb}</p>
              </div>
              <div className="tier-scroll">
                {groups.map((group) => {
                  const key = groupKey(group);
                  return (
                    <GroupSection
                      expanded={isExpanded(group)}
                      group={group}
                      key={key}
                      lineage={lineage}
                      onShowAll={handleShowAll}
                      onToggle={toggleGroup}
                      showAll={showAll.has(key)}
                    />
                  );
                })}
              </div>
              {hidden?.above ? (
                <div className="path-marker above">
                  ↑ {hidden.above} more on path above
                </div>
              ) : null}
              {hidden?.below ? (
                <div className="path-marker below">
                  ↓ {hidden.below} more on path below
                </div>
              ) : null}
            </div>
          );
        })}
        <svg
          className="lineage"
          width={lineageState.width}
          height={lineageState.height}
        >
          {lineageState.paths.map(({ d, fan, ends }, i) => (
            <g key={i} className={cx({ fan })}>
              <path d={d} />
              {ends.map(([x, y], j) => (
                <circle key={j} cx={x} cy={y} r={3.5} />
              ))}
            </g>
          ))}
        </svg>
      </div>
      <TokenDetail name={selected} />
    </main>
  );
};
