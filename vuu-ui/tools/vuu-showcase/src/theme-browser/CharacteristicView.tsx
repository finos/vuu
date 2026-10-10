import type { ThemeToken } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import cx from "clsx";
import { CSSProperties, useMemo } from "react";
import {
  capitalise,
  parseCharacteristic,
  stateRank,
  variantLabel,
} from "./model-utils";
import { TokenDetail } from "./TokenDetail";
import { TokenPreview } from "./TokenPreview";
import { useStageStyle, useThemeBrowser } from "./ThemeBrowserContext";

const SPECIMEN_PROPERTIES = ["background", "borderColor", "foreground"];
const SWATCH_LABELS: Record<string, string> = {
  background: "bg",
  borderColor: "border",
  foreground: "fg",
};

export interface CharacteristicViewProps {
  characteristic?: string;
  onSelectCharacteristic: (name: string) => void;
}

export const CharacteristicView = ({
  characteristic,
  onSelectCharacteristic,
}: CharacteristicViewProps) => {
  const { index, model, resolve, select, selected } = useThemeBrowser();
  const stageStyle = useStageStyle();
  const groups = model.groups.characteristics;
  const group =
    groups.find((g) => g.name === characteristic) ??
    groups.find((g) => g.name === "actionable") ??
    groups[0];

  const { lookup, otherProperties, states, tokens, variants } = useMemo(() => {
    const tokens = (group?.tokens ?? []).flatMap((n) => index.token(n) ?? []);
    const parsed = tokens.map((token) => ({
      token,
      ...parseCharacteristic(token),
    }));
    return {
      tokens,
      variants: [...new Set(parsed.map((p) => p.variant))],
      states: [...new Set(parsed.map((p) => p.state))].sort(
        (a, b) => stateRank(a) - stateRank(b),
      ),
      lookup: new Map(
        parsed.map((p) => [`${p.variant}|${p.property}|${p.state}`, p.token]),
      ),
      otherProperties: [
        ...new Set(
          parsed
            .map((p) => p.property)
            .filter((p) => !SPECIMEN_PROPERTIES.includes(p)),
        ),
      ],
    };
  }, [group, index]);

  if (!group) {
    return <main className="char-view empty">No characteristics</main>;
  }

  // the detail panel follows the selection while it is in this characteristic
  const inGroup = selected && index.token(selected)?.group === group.name;
  const detailToken = inGroup
    ? selected
    : [`--salt-${group.name}-bold-background-hover`, group.tokens[0]].find(
        (name) => index.token(name),
      );

  const specimenBase: CSSProperties = {
    height: resolve("--salt-size-base") || "28px",
    borderRadius: resolve("--salt-palette-corner") || "4px",
    fontFamily: resolve("--salt-text-action-fontFamily") || "inherit",
    fontWeight: resolve("--salt-text-action-fontWeight") || 600,
  };

  const cell = (variant: string, state: string) => {
    const [bg, border, fg] = SPECIMEN_PROPERTIES.map((property) =>
      lookup.get(`${variant}|${property}|${state}`),
    );
    const key = `${variant}|${state}`;
    if (!bg && !border && !fg) {
      return (
        <td className="cell empty" key={key}>
          <span className="dash">—</span>
        </td>
      );
    }
    const swatches: [string, ThemeToken | undefined][] = [
      ["background", bg],
      ["borderColor", border],
      ["foreground", fg],
    ];
    const isSelected = [bg, border, fg].some((t) => t?.name === detailToken);
    return (
      <td
        className={cx("cell", { selected: isSelected })}
        key={key}
        onClick={() => select((bg ?? border ?? fg)!.name)}
      >
        <div
          className="specimen"
          style={{
            ...specimenBase,
            background: bg ? resolve(bg.name) : undefined,
            borderColor: border ? resolve(border.name) : "transparent",
            color: fg ? resolve(fg.name) : undefined,
          }}
        >
          {variantLabel(variant)}
        </div>
        <div className="cell-swatches">
          {swatches.map(([property, token]) =>
            token ? (
              <button
                className={cx("sw", { selected: token.name === detailToken })}
                key={property}
                onClick={(e) => {
                  e.stopPropagation();
                  select(token.name);
                }}
                title={token.name}
              >
                <TokenPreview token={token} size="xs" />
                {SWATCH_LABELS[property]}
              </button>
            ) : (
              <span className="sw none" key={property}>
                {SWATCH_LABELS[property]}
              </span>
            ),
          )}
        </div>
      </td>
    );
  };

  return (
    <main className="char-view">
      <nav className="char-list">
        <div className="list-title">Characteristics</div>
        {groups.map((g) => (
          <button
            className={cx("char-item", { selected: g === group })}
            key={g.name}
            onClick={() => onSelectCharacteristic(g.name)}
          >
            <span className="tier-mark xs characteristics" />
            <span>{g.name}</span>
            <span className="count">{g.tokens.length}</span>
          </button>
        ))}
      </nav>
      <section className="char-main">
        <div className="char-head">
          <div>
            <div className="eyebrow">Characteristic</div>
            <h2>{capitalise(group.name)}</h2>
            <p className="muted">
              {tokens.length} tokens · {variants.length} variants ×{" "}
              {states.length} states ·{" "}
              <span className="mono">{group.file}</span>
            </p>
          </div>
          <div className="legend">
            <span>Token anatomy</span>
            <code>
              <i className="a">--salt-{group.name}</i>-
              <i className="b">{"{variant}"}</i>-
              <i className="c">{"{property}"}</i>-
              <i className="d">{"{state}"}</i>
            </code>
          </div>
        </div>
        <div className="matrix-wrap stage" style={stageStyle}>
          <table className="matrix">
            <thead>
              <tr>
                <th className="corner">variant \ state</th>
                {states.map((s) => (
                  <th key={s}>{s || "default"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v}>
                  <th className="row-head">{variantLabel(v)}</th>
                  {states.map((s) => cell(v, s))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {otherProperties.length ? (
          <div className="other-props">
            <h4>Other properties</h4>
            {otherProperties.map((p) => (
              <span className="chip subtle" key={p}>
                {p}
              </span>
            ))}
          </div>
        ) : null}
      </section>
      <TokenDetail name={detailToken} />
    </main>
  );
};
