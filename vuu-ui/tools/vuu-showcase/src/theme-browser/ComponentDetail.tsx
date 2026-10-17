import cx from "clsx";
import { useState } from "react";
import { declarationsUsing, type ComponentUsage } from "./component-utils";
import { TIER_INFO, TIERS, withoutPrefix } from "./model-utils";
import { useThemeBrowser } from "./ThemeBrowserContext";
import { TileButton } from "./TileButton";

const DECLARATION_LIMIT = 12;
const VARIABLE_LIMIT = 24;

const VariableList = ({ names }: { names: string[] }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? names : names.slice(0, VARIABLE_LIMIT);
  return (
    <div className="used-by">
      {visible.map((name) => (
        <span className="used-chip static" key={name} title={name}>
          <span className="mono">{name}</span>
        </span>
      ))}
      {names.length > visible.length ? (
        <TileButton className="used-chip more" onClick={() => setShowAll(true)}>
          +{names.length - visible.length} more
        </TileButton>
      ) : null}
    </div>
  );
};

/**
 * Details of a component, the theme tokens and other custom properties its
 * css references, and the declarations that reference them.
 */
export const ComponentDetail = ({ usage }: { usage: ComponentUsage }) => {
  const { components, select } = useThemeBrowser();
  const [showAllDeclarations, setShowAllDeclarations] = useState<string>();
  const { component, tokens, apiVariables, localVariables } = usage;
  const library = components?.libraries.find((l) => l.id === component.library);
  const declarations =
    showAllDeclarations === component.id
      ? component.declarations
      : component.declarations.slice(0, DECLARATION_LIMIT);

  return (
    <aside className="detail component-detail">
      <div className="detail-head">
        <div className="crumbs">
          <span className="tier-mark components" />
          {library?.label ?? component.library}
          <span className="sep">/</span>
          component
          <span className="chip subtle">
            {component.declarations.length} declarations
          </span>
        </div>
        <h3>{component.label}</h3>
      </div>

      <section className="panel-section">
        <h4>
          Theme tokens <span className="count">{tokens.length}</span>
        </h4>
        {tokens.length ? (
          TIERS.map((tier) => {
            const tierTokens = tokens.filter((t) => t.tier === tier);
            return tierTokens.length ? (
              <div className="token-tier" key={tier}>
                <div className="token-tier-title">
                  <span className={cx("tier-mark xs", tier)} />
                  {TIER_INFO[tier].label}
                  <span className="count">{tierTokens.length}</span>
                </div>
                <div className="used-by">
                  {tierTokens.map((t) => (
                    <TileButton
                      className="used-chip"
                      key={t.name}
                      onClick={() => select(t.name)}
                      title={declarationsUsing(component, t.name)
                        .map((d) => `${d.selector} { ${d.property} }`)
                        .join("\n")}
                    >
                      <span className={cx("tier-mark xs", t.tier)} />
                      <span className="mono">{withoutPrefix(t.name)}</span>
                    </TileButton>
                  ))}
                </div>
              </div>
            ) : null;
          })
        ) : (
          <div className="empty">No theme tokens are referenced directly</div>
        )}
      </section>

      {apiVariables.length ? (
        <section className="panel-section">
          <h4>
            API variables <span className="count">{apiVariables.length}</span>
          </h4>
          <VariableList names={apiVariables} />
        </section>
      ) : null}

      {localVariables.length ? (
        <section className="panel-section">
          <h4>
            Other variables{" "}
            <span className="count">{localVariables.length}</span>
          </h4>
          <VariableList names={localVariables} />
        </section>
      ) : null}

      <section className="panel-section">
        <h4>
          Declarations{" "}
          <span className="count">{component.declarations.length}</span>
        </h4>
        <ol className="declarations">
          {declarations.map((d) => (
            <li
              key={`${d.location.file}:${d.location.line}:${d.location.column}`}
              title={`${d.location.file}:${d.location.line}`}
            >
              <div className="mono declaration-selector">
                {d.atRules?.length ? `${d.atRules.join(" ")} ` : ""}
                {d.selector}
              </div>
              <div className="mono declaration-body">
                <span className="property">{d.property}</span>: {d.value}
              </div>
            </li>
          ))}
        </ol>
        {component.declarations.length > declarations.length ? (
          <TileButton
            className="used-chip more"
            onClick={() => setShowAllDeclarations(component.id)}
          >
            +{component.declarations.length - declarations.length} more
          </TileButton>
        ) : null}
      </section>

      <section className="panel-section source">
        <h4>Source</h4>
        {component.sources.map((file) => (
          <div className="source-row" key={file}>
            <span className="mono">{file}</span>
          </div>
        ))}
        <div className="source-row">
          <TileButton className="ghost" disabled>
            Edit component css
          </TileButton>
        </div>
        <div className="roadmap">Component css editing – roadmap</div>
      </section>
    </aside>
  );
};
