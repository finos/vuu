import type {
  ThemeGroup,
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
import { ComponentDetail } from "./ComponentDetail";
import {
  COMPONENT_ID_PREFIX,
  componentKey,
  type ComponentUsage,
} from "./component-utils";
import { TokenDetail } from "./TokenDetail";
import { TokenPreview } from "./TokenPreview";
import { useThemeBrowser } from "./ThemeBrowserContext";
import { TileButton } from "./TileButton";

/**
 * in-lineage: on the path of the selected token
 * referenced: referenced by the selected component
 */
type Highlight = "in-lineage" | "referenced";

/**
 * [referenced token, referencing token, kind], components are identified by
 * componentKey
 */
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
  hidden: Partial<Record<string, { above: number; below: number }>>;
}

const groupKey = (group: ThemeGroup) =>
  `${group.tier}/${group.layer}/${group.name}`;

const isRampGroup = (group: ThemeGroup, tokens: ThemeToken[]) =>
  group.tier === "foundations" && tokens.filter(rampOf).length > 20;

const MINI_STRIP_COUNT = 14;

const TokenRow = ({
  token,
  lineage,
  highlight,
}: {
  token: ThemeToken;
  lineage: boolean;
  highlight: Highlight;
}) => {
  const { resolve, select, selected, selectedComponent } = useThemeBrowser();
  const value = resolve(token.name);
  return (
    <div
      className={cx("token-row", {
        [highlight]: lineage,
        selected: !selectedComponent && token.name === selected,
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
  highlight,
}: {
  tokens: ThemeToken[];
  lineage: Set<string>;
  highlight: Highlight;
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
                    [highlight]: lineage.has(token.name),
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
  /** how tokens in the lineage are highlighted */
  highlight: Highlight;
  onToggle: (key: string) => void;
  onShowAll: (key: string, showAll: boolean) => void;
  showAll: boolean;
}

const GroupSection = ({
  expanded,
  group,
  lineage,
  highlight,
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
          <Ramps tokens={tokens} lineage={lineage} highlight={highlight} />
          {restShown.map((t) => (
            <TokenRow
              highlight={highlight}
              key={t.name}
              lineage={lineage.has(t.name)}
              token={t}
            />
          ))}
          {highlight === "referenced" ? null : restShown.length <
            rest.length ? (
            <TileButton
              className="more-row"
              onClick={() => onShowAll(key, true)}
            >
              + {rest.length - restShown.length} more in {group.name}
            </TileButton>
          ) : null}
        </div>
      );
    } else {
      const shown = all ? tokens : onPath;
      body = (
        <div className="group-body">
          {shown.map((t) => (
            <TokenRow
              highlight={highlight}
              key={t.name}
              lineage={lineage.has(t.name)}
              token={t}
            />
          ))}
          {highlight === "referenced" ? null : shown.length < tokens.length ? (
            <TileButton
              className="more-row"
              onClick={() => onShowAll(key, true)}
            >
              + {tokens.length - shown.length} more in {group.name}
            </TileButton>
          ) : showAll && onPath.length > 0 && onPath.length < tokens.length ? (
            <TileButton
              className="more-row"
              onClick={() => onShowAll(key, false)}
            >
              − show path only
            </TileButton>
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
      <TileButton
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
          <span
            className={cx(
              "chip",
              highlight === "referenced" ? "referenced" : "accent",
            )}
          >
            {onPath.length} {highlight === "referenced" ? "used" : "in path"}
          </span>
        ) : null}
        <span className="group-count">{tokens.length}</span>
      </TileButton>
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
    (name.startsWith(COMPONENT_ID_PREFIX)
      ? container.querySelector<HTMLElement>(
          `[data-component="${CSS.escape(name.slice(COMPONENT_ID_PREFIX.length))}"]`,
        )
      : container.querySelector<HTMLElement>(
          `[data-token="${CSS.escape(name)}"]`,
        )) ??
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
    el.closest<HTMLElement>("[data-tier]")?.dataset.tier ?? "";

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
      ".component-row.in-lineage, .token-row.in-lineage, .ramp-cell.in-lineage",
    );
    if (!target) continue;
    const s = scroller.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (t.top < s.top + 32 || t.bottom > s.bottom) {
      scroller.scrollTop += t.top - s.top - scroller.clientHeight * 0.3;
    }
  }
};

const PathMarkers = ({
  hidden,
}: {
  hidden?: { above: number; below: number };
}) => (
  <>
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
  </>
);

const ComponentRow = ({
  lineage,
  usage,
}: {
  lineage: boolean;
  usage: ComponentUsage;
}) => {
  const { selectComponent, selectedComponent } = useThemeBrowser();
  const { component, tokens } = usage;
  return (
    <div
      className={cx("component-row", {
        "in-lineage": lineage,
        selected: component.id === selectedComponent,
      })}
      data-component={component.id}
      onClick={() => selectComponent(component.id)}
      title={`${component.label}: references ${tokens.length} theme tokens`}
    >
      <span className="component-name">{component.label}</span>
      <span className="token-value">{tokens.length}</span>
    </div>
  );
};

const ComponentsColumn = ({
  hidden,
  lineage,
}: {
  hidden?: { above: number; below: number };
  lineage: Set<string>;
}) => {
  const { components } = useThemeBrowser();
  if (!components) return null;
  return (
    <div className="tier tier-components" data-tier="components">
      <div className="tier-header">
        <div className="tier-title">
          <span className="tier-mark components" />
          <h2>Components</h2>
          <span className="tier-count">{components.size}</span>
        </div>
        <p className="tier-blurb">Theme tokens referenced by component css</p>
      </div>
      <div className="tier-scroll">
        {components.libraries.map((library) => (
          <section className="group expanded" key={library.id}>
            <div className="group-header library-header">
              <span className="group-name">{library.label}</span>
              <span className="group-count">{library.components.length}</span>
            </div>
            <div className="group-body">
              {library.components.map((usage) => (
                <ComponentRow
                  key={usage.component.id}
                  lineage={lineage.has(componentKey(usage.component.id))}
                  usage={usage}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <PathMarkers hidden={hidden} />
    </div>
  );
};

export const TiersView = () => {
  const {
    axes,
    components,
    index,
    model,
    selected,
    selectedComponent,
    showAllTokens,
    showComponents,
  } = useThemeBrowser();
  const columnsRef = useRef<HTMLDivElement>(null);
  const [userExpanded, setUserExpanded] = useState<Set<string>>(new Set());
  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState<Set<string>>(new Set());
  const [lineageState, setLineageState] = useState(LINEAGE_NONE);
  const [prevSelected, setPrevSelected] = useState(selected);
  const [prevComponent, setPrevComponent] = useState(selectedComponent);
  const componentUsage = selectedComponent
    ? components?.usage(selectedComponent)
    : undefined;

  if (selected !== prevSelected || selectedComponent !== prevComponent) {
    // a new selection always reveals its path
    setPrevSelected(selected);
    setPrevComponent(selectedComponent);
    setUserCollapsed(new Set());
    if (selectedComponent !== prevComponent) {
      // a component's groups are presented collapsed
      setUserExpanded(new Set());
    }
  }

  const { edges, lineage } = useMemo(() => {
    if (componentUsage) {
      // no connectors, a component may reference hundreds of tokens
      const key = componentKey(componentUsage.component.id);
      return {
        edges: [] as Edge[],
        lineage: new Set([key, ...componentUsage.tokens.map((t) => t.name)]),
      };
    }
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
    const users = showComponents
      ? (components?.componentsUsing(selected) ?? []).map((u) =>
          componentKey(u.component.id),
        )
      : [];
    if (index.token(selected)?.tier === "characteristics") {
      for (const user of users) {
        edges.push([selected, user, "fan"]);
      }
    }
    return { edges, lineage: new Set([...chain, ...consumers, ...users]) };
  }, [axes, componentUsage, components, index, selected, showComponents]);

  const isExpanded = (group: ThemeGroup) => {
    const key = groupKey(group);
    if (userCollapsed.has(key)) return false;
    if (componentUsage) return userExpanded.has(key);
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
    const container = columnsRef.current;
    if (!container) return;
    if (selectedComponent) {
      for (const scroller of container.querySelectorAll<HTMLElement>(
        ".tier:not([data-tier='components']) .tier-scroll",
      )) {
        scroller.scrollTop = 0;
      }
    } else {
      scrollPathIntoView(container);
    }
  }, [selected, selectedComponent, showAllTokens, showComponents]);

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
      <div
        className={cx("columns", { "with-components": showComponents })}
        ref={columnsRef}
      >
        {showComponents ? (
          <ComponentsColumn
            hidden={lineageState.hidden.components}
            lineage={lineage}
          />
        ) : null}
        {TIERS.map((tier) => {
          const allGroups = model.groups[tier];
          const count = allGroups.reduce((n, g) => n + g.tokens.length, 0);
          const used = componentUsage?.tokens.filter(
            (t) => t.tier === tier,
          ).length;
          // a component shows only the groups it references, unless all are requested
          const groups =
            componentUsage && !showAllTokens
              ? allGroups.filter((g) => g.tokens.some((n) => lineage.has(n)))
              : allGroups;
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
                  <span className="tier-count">
                    {used === undefined ? count : `${used} / ${count}`}
                  </span>
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
                      highlight={componentUsage ? "referenced" : "in-lineage"}
                      onShowAll={handleShowAll}
                      onToggle={toggleGroup}
                      showAll={
                        componentUsage ? showAllTokens : showAll.has(key)
                      }
                    />
                  );
                })}
                {groups.length === 0 ? (
                  <div className="empty tier-empty">
                    No {TIER_INFO[tier].label.toLowerCase()} tokens referenced
                  </div>
                ) : null}
              </div>
              <PathMarkers hidden={hidden} />
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
      {componentUsage ? (
        <ComponentDetail usage={componentUsage} />
      ) : (
        <TokenDetail name={selected} />
      )}
    </main>
  );
};
