import cx from "clsx";
import { useState } from "react";
import { displayValue, TIER_INFO, withoutPrefix } from "./model-utils";
import { TokenPreview } from "./TokenPreview";
import { useStageStyle, useThemeBrowser } from "./ThemeBrowserContext";

const USED_BY_LIMIT = 10;

export const TokenDetail = ({ name }: { name?: string }) => {
  const { axes, index, resolve, select, setAxes } = useThemeBrowser();
  const [showAllUsers, setShowAllUsers] = useState<string | undefined>();
  const stageStyle = useStageStyle();
  const token = name ? index.token(name) : undefined;

  if (!token) {
    return (
      <aside className="detail">
        <div className="detail-empty">Select a token to see its details</div>
      </aside>
    );
  }

  const chain = index.chainOf(token.name, axes);
  const resolved = resolve(token.name);
  const value = index.activeValue(token, axes);
  const varying = index.varyingAxes(token);
  const usedBy = token.referencedBy.flatMap((n) => index.token(n) ?? []);
  const visibleUsers =
    showAllUsers === token.name ? usedBy : usedBy.slice(0, USED_BY_LIMIT);
  const location = (value ?? token.values[0])?.location;

  return (
    <aside className="detail">
      <div className="detail-head">
        <div className="crumbs">
          <span className={cx("tier-mark", token.tier)} />
          {TIER_INFO[token.tier].label}
          <span className="sep">/</span>
          {token.group}
          {token.layer === "legacy" ? (
            <span className="chip legacy">legacy</span>
          ) : null}
          <span className="chip subtle">{token.category}</span>
        </div>
        <h3 className="mono">{token.name}</h3>
      </div>

      <div className="hero stage" style={stageStyle}>
        <TokenPreview token={token} size="lg" />
        <div className="hero-text">
          <div className="hero-value">{displayValue(token, resolved)}</div>
          <div className="hero-sub">
            {Object.entries(axes)
              .filter(([k]) => ["mode", "density", "accent"].includes(k))
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </div>
        </div>
      </div>

      <section className="panel-section">
        <h4>Resolution</h4>
        <ol className="chain">
          {chain.map((step, i) =>
            step.token === undefined ? (
              <li className="missing" key={step.missing}>
                <span className="dot" />
                <span className="mono chain-name">{step.missing}</span>
                <span className="chip warn">not declared</span>
              </li>
            ) : (
              <li
                className={cx("clickable", { first: i === 0 })}
                key={step.token.name}
                onClick={() => select(step.token.name)}
              >
                <span className={cx("dot", step.token.tier)} />
                <div className="chain-body">
                  <div className="chain-name mono">{step.token.name}</div>
                  <div className="chain-raw mono">{step.value?.raw ?? "—"}</div>
                </div>
                <span className="chip subtle">
                  {TIER_INFO[step.token.tier].label}
                </span>
              </li>
            ),
          )}
          {chain.at(-1)?.token ? (
            <li className="literal">
              <span className="dot literal" />
              <div className="chain-body">
                <div className="chain-name">Computed value</div>
                <div className="chain-raw mono">{resolved || "—"}</div>
              </div>
            </li>
          ) : null}
        </ol>
      </section>

      <section className="panel-section">
        <h4>
          Values by scope
          <span className="count">{token.values.length}</span>
        </h4>
        <div className="scope-table">
          {token.values.map((v) => {
            const scope = index.scope(v.scopeId);
            const conditions = scope?.conditions ?? {};
            const scopeAxes = { ...axes, ...conditions };
            const hasConditions = Object.keys(conditions).length > 0;
            return (
              <div
                className={cx("scope-row", {
                  active: v === value,
                  clickable: hasConditions,
                  complex: scope?.complex || scope?.atRules,
                })}
                key={`${v.scopeId}:${v.location.file}:${v.location.line}`}
                onClick={hasConditions ? () => setAxes(scopeAxes) : undefined}
                title={
                  hasConditions
                    ? `${scope?.selector}\nclick to apply these axes`
                    : scope?.selector
                }
              >
                <div className="conds">
                  {hasConditions ? (
                    Object.entries(conditions).map(([k, val]) => (
                      <span className="cond" key={k}>
                        <b>{k}</b>
                        {val}
                      </span>
                    ))
                  ) : (
                    <span className="cond base">
                      {scope?.complex || scope?.atRules ? "complex" : "base"}
                    </span>
                  )}
                </div>
                {token.category === "color" ? (
                  <TokenPreview token={token} size="xs" axes={scopeAxes} />
                ) : null}
                <span className="mono raw" title={v.raw}>
                  {v.raw}
                </span>
                {v === value ? (
                  <span className="chip accent">active</span>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="axis-note">
          {varying.length
            ? `Varies by ${varying.map((a) => a.name).join(", ")}`
            : "Constant across theme axes"}
        </div>
      </section>

      <section className="panel-section">
        <h4>
          Used by <span className="count">{usedBy.length}</span>
        </h4>
        {usedBy.length ? (
          <div className="used-by">
            {visibleUsers.map((t) => (
              <button
                className="used-chip"
                key={t.name}
                onClick={() => select(t.name)}
                title={t.name}
              >
                <span className={cx("tier-mark xs", t.tier)} />
                <span className="mono">{withoutPrefix(t.name)}</span>
              </button>
            ))}
            {usedBy.length > visibleUsers.length ? (
              <button
                className="used-chip more"
                onClick={() => setShowAllUsers(token.name)}
              >
                +{usedBy.length - visibleUsers.length} more
              </button>
            ) : null}
          </div>
        ) : (
          <div className="empty">
            Not referenced by other theme tokens – consumed by components
          </div>
        )}
      </section>

      <section className="panel-section source">
        <h4>Source</h4>
        <div className="source-row">
          <span className="mono">
            {location ? `${location.file}:${location.line}` : "—"}
          </span>
          <button className="ghost" disabled>
            Open in VS Code
          </button>
          <button className="ghost" disabled>
            Edit value
          </button>
        </div>
        <div className="roadmap">
          Editing &amp; VS Code integration – roadmap
        </div>
      </section>
    </aside>
  );
};
