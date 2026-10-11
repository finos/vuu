import type { ThemeToken } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import cx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { rampOf, readableOn, shortName, toHex } from "./model-utils";
import { useStageStyle, useThemeBrowser } from "./ThemeBrowserContext";

const SCALE_LIMIT = 10;

const DensityTable = ({ tokens }: { tokens: ThemeToken[] }) => {
  const { axes, model, sandbox, select } = useThemeBrowser();
  const densities =
    model.axes.find((axis) => axis.name === "density")?.values ?? [];
  if (!densities.length) {
    return <div className="empty">This theme has no density axis</div>;
  }
  return (
    <table className="density-table">
      <thead>
        <tr>
          <th />
          {densities.map((d) => (
            <th className={cx({ current: d === axes.density })} key={d}>
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => (
          <tr
            className="clickable"
            key={t.name}
            onClick={() => select(t.name, "tiers")}
            title={t.name}
          >
            <th className="mono">{t.segments.slice(1).join("-")}</th>
            {densities.map((d) => {
              const px = sandbox.measure(t.name, { ...axes, density: d });
              return (
                <td className={cx({ current: d === axes.density })} key={d}>
                  <div className="dbar-wrap">
                    <span
                      className="dbar"
                      style={{ width: Math.min(px * 3, 120) }}
                    />
                    <span className="mono dval">{+px.toFixed(1)}px</span>
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const GENERIC_FAMILIES =
  /^(system-ui|sans-serif|serif|monospace|cursive|fantasy|inherit)$/i;

/**
 * The sandbox cannot load fonts (@font-face is not honoured in a shadow root),
 * so a theme font renders only if the host page has declared it.
 */
const useFontDeclared = () => {
  const [, forceRender] = useState({});
  useEffect(() => {
    document.fonts.ready.then(() => forceRender({}));
  }, []);
  return (family: string) => {
    const first = family.split(",")[0]?.trim().replace(/["']/g, "");
    if (!first || GENERIC_FAMILIES.test(first)) return true;
    return [...document.fonts].some(
      (face) =>
        face.family.replace(/["']/g, "").toLowerCase() === first.toLowerCase(),
    );
  };
};

export const FoundationsView = () => {
  const { index, model, resolve, select } = useThemeBrowser();
  const shadowStage = useStageStyle("--salt-container-secondary-background");

  const {
    curves,
    fontFamilies,
    ramps,
    shadows,
    sizes,
    spacing,
    steps,
    weights,
  } = useMemo(() => {
    const tokens = Object.values(model.tokens).filter(
      (t) => t.tier === "foundations" && t.layer !== "legacy",
    );
    const ramps = new Map<string, Map<number, ThemeToken>>();
    for (const token of tokens) {
      const ramp = rampOf(token);
      if (ramp && token.prefix === "salt") {
        const steps = ramps.get(ramp.hue) ?? new Map();
        steps.set(ramp.step, token);
        ramps.set(ramp.hue, steps);
      }
    }
    const scale = (group: string) =>
      tokens
        .filter(
          (t) =>
            t.group === group &&
            t.category === "dimension" &&
            !/fixed|unit/.test(t.name),
        )
        .slice(0, SCALE_LIMIT);
    return {
      ramps,
      steps: [
        ...new Set([...ramps.values()].flatMap((steps) => [...steps.keys()])),
      ].sort((a, b) => a - b),
      sizes: scale("size"),
      spacing: scale("spacing"),
      curves: scale("curve"),
      fontFamilies: tokens.filter((t) => t.category === "font-family"),
      weights: tokens.filter((t) => t.category === "font-weight"),
      shadows: Object.values(model.tokens).filter(
        (t) => t.category === "shadow" && t.tier === "palette",
      ),
    };
  }, [model]);

  const fontDeclared = useFontDeclared();
  const colorFile = ramps.size
    ? index.token([...[...ramps.values()][0].values()][0].name)?.values[0]
        ?.location.file
    : undefined;

  return (
    <main className="foundations-view">
      <section className="f-card span-2">
        <div className="f-head">
          <h3>Colour ramps</h3>
          <span className="muted">
            {ramps.size} hues · {steps.length} steps
            {colorFile ? ` · ${colorFile}` : ""}
          </span>
        </div>
        <table className="ramp-table">
          <thead>
            <tr>
              <th />
              {steps.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...ramps.entries()].map(([hue, hueSteps]) => (
              <tr key={hue}>
                <th>{hue}</th>
                {steps.map((s) => {
                  const token = hueSteps.get(s);
                  const value = token ? resolve(token.name) : "";
                  return (
                    <td key={s}>
                      {token ? (
                        <button
                          className="big-cell"
                          onClick={() => select(token.name, "tiers")}
                          style={{ background: value }}
                          title={token.name}
                        >
                          <span
                            className="hex"
                            style={{ color: readableOn(value) }}
                          >
                            {toHex(value).replace("#", "")}
                          </span>
                        </button>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="f-card">
        <div className="f-head">
          <h3>Size</h3>
          <span className="muted">compared across densities</span>
        </div>
        <DensityTable tokens={sizes} />
      </section>

      <section className="f-card">
        <div className="f-head">
          <h3>Spacing</h3>
          <span className="muted">compared across densities</span>
        </div>
        <DensityTable tokens={spacing} />
      </section>

      <section className="f-card">
        <div className="f-head">
          <h3>Typography</h3>
        </div>
        {fontFamilies.map((t) => {
          const family = resolve(t.name);
          return (
            <div
              className="type-row clickable"
              key={t.name}
              onClick={() => select(t.name, "tiers")}
              title={family}
            >
              <span className="type-specimen" style={{ fontFamily: family }}>
                The quick brown fox
              </span>
              <span className="type-meta">
                {fontDeclared(family) ? null : (
                  <span
                    className="chip warn"
                    title="This font is not declared by the showcase page, a fallback is shown"
                  >
                    font not loaded
                  </span>
                )}
                <span className="mono muted">{shortName(t)}</span>
              </span>
            </div>
          );
        })}
        <div className="weights">
          {weights.map((t) => (
            <button
              className="weight"
              key={t.name}
              onClick={() => select(t.name, "tiers")}
              title={t.name}
            >
              <span style={{ fontWeight: resolve(t.name) }}>Ag</span>
              <span className="mono">{resolve(t.name)}</span>
              <span className="muted">{t.segments.at(-1)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="f-card">
        <div className="f-head">
          <h3>Elevation &amp; curve</h3>
          <span className="muted">shadow (palette) · curve</span>
        </div>
        <div className="shadows stage" style={shadowStage}>
          {shadows.map((t) => (
            <button
              className="shadow-card"
              key={t.name}
              onClick={() => select(t.name, "tiers")}
              style={{
                background: resolve("--salt-container-primary-background"),
                boxShadow: resolve(t.name),
                color: "inherit",
              }}
              title={t.name}
            >
              <span>{t.segments.at(-1)}</span>
            </button>
          ))}
        </div>
        <div className="curves">
          {curves.map((t) => (
            <button
              className="curve"
              key={t.name}
              onClick={() => select(t.name, "tiers")}
              title={t.name}
            >
              <span
                className="curve-box"
                style={{ borderTopLeftRadius: resolve(t.name) }}
              />
              <span className="mono">{t.segments.at(-1)}</span>
              <span className="muted">{resolve(t.name)}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};
