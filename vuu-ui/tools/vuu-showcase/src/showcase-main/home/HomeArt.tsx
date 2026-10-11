import type { CSSProperties, ReactElement } from "react";
import type { AreaArtVariant } from "./home-config";
import type { StartHereArt } from "./home-model";

/**
 * Decorative sketches for the home page cards, simple abstractions of the
 * kind of component found in an area. Coloured from the showcase chrome
 * tokens (and, for the theme card, foundation colours of the chrome theme).
 */

const classBase = "ShowcaseHomeArt";

type SketchKind = "accent" | "box" | "line";

const Sk = ({
  kind = "line",
  style,
}: {
  kind?: SketchKind;
  style: CSSProperties;
}) => <div className={`${classBase}-sk ${classBase}-sk-${kind}`} style={style} />;

const lines = (x: number, y: number, width: number, count: number, gap = 12) =>
  Array.from({ length: count }, (_, i) => (
    <Sk
      key={`line-${i}`}
      style={{
        height: 5,
        left: x,
        top: y + i * gap,
        width: width - (i % 3) * 18,
      }}
    />
  ));

const pill = { borderRadius: 999 };

const areaSketches: Record<AreaArtVariant, () => ReactElement> = {
  controls: () => (
    <>
      <Sk kind="accent" style={{ borderRadius: 6, height: 24, left: 18, top: 20, width: 64 }} />
      <Sk kind="box" style={{ borderRadius: 6, height: 24, left: 90, top: 20, width: 64 }} />
      <Sk kind="box" style={{ ...pill, height: 18, left: 18, top: 56, width: 34 }} />
      <Sk kind="accent" style={{ ...pill, height: 12, left: 21, top: 59, width: 12 }} />
      <Sk kind="box" style={{ height: 18, left: 62, top: 56, width: 150 }} />
    </>
  ),
  date: () => (
    <>
      <Sk kind="box" style={{ height: 78, left: 18, top: 14, width: 120 }} />
      {Array.from({ length: 15 }, (_, i) => (
        <Sk
          key={i}
          kind={i === 8 ? "accent" : "line"}
          style={{
            height: 10,
            left: 26 + (i % 5) * 22,
            opacity: i === 8 ? 1 : 0.5,
            top: 32 + Math.floor(i / 5) * 18,
            width: 14,
          }}
        />
      ))}
    </>
  ),
  extras: () => (
    <>
      <Sk kind="box" style={{ height: 72, left: 18, top: 16, width: 120 }} />
      {lines(26, 26, 90, 5)}
      <Sk
        kind="box"
        style={{ boxShadow: "var(--sc-shadow-2)", height: 72, left: 148, top: 16, width: 90 }}
      />
    </>
  ),
  filters: () => (
    <>
      <Sk kind="box" style={{ ...pill, height: 22, left: 18, top: 22, width: 58 }} />
      <Sk kind="accent" style={{ ...pill, height: 22, left: 84, opacity: 0.7, top: 22, width: 74 }} />
      <Sk kind="box" style={{ ...pill, height: 22, left: 166, top: 22, width: 52 }} />
      <Sk kind="box" style={{ height: 28, left: 18, top: 56, width: 200 }} />
    </>
  ),
  generic: () => (
    <>
      <Sk kind="box" style={{ height: 72, left: 18, top: 16, width: "calc(100% - 36px)" }} />
      {lines(30, 30, 140, 4)}
      <Sk kind="accent" style={{ borderRadius: 6, height: 18, right: 30, top: 66, width: 48 }} />
    </>
  ),
  layout: () => (
    <>
      <Sk kind="box" style={{ height: 76, left: 18, top: 14, width: 70 }} />
      <Sk kind="box" style={{ height: 34, left: 94, top: 14, width: 150 }} />
      <Sk kind="box" style={{ height: 36, left: 94, top: 54, width: 150 }} />
    </>
  ),
  salt: () => (
    <>
      <Sk kind="accent" style={{ borderRadius: "50%", height: 30, left: 18, top: 18, width: 30 }} />
      <Sk
        style={{
          background: "var(--salt-color-red-400, #e0457b)",
          borderRadius: "50%",
          height: 30,
          left: 56,
          opacity: 0.75,
          top: 18,
          width: 30,
        }}
      />
      <Sk
        style={{
          background: "var(--sc-ok)",
          borderRadius: "50%",
          height: 30,
          left: 94,
          opacity: 0.75,
          top: 18,
          width: 30,
        }}
      />
      <Sk kind="box" style={{ height: 28, left: 18, top: 58, width: 200 }} />
    </>
  ),
  shell: () => (
    <>
      <Sk kind="accent" style={{ height: 12, left: 18, opacity: 0.5, top: 14, width: "calc(100% - 36px)" }} />
      <Sk kind="box" style={{ height: 58, left: 18, top: 32, width: 40 }} />
      <Sk kind="box" style={{ height: 58, left: 64, top: 32, width: "calc(100% - 82px)" }} />
    </>
  ),
  table: () => (
    <>
      <Sk kind="box" style={{ height: 72, left: 18, top: 16, width: "calc(100% - 36px)" }} />
      <Sk kind="accent" style={{ height: 12, left: 18, opacity: 0.25, top: 16, width: "calc(100% - 36px)" }} />
      {lines(26, 36, 180, 4)}
    </>
  ),
};

const SWATCH_SHADES = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const startHereSketches: Record<StartHereArt, () => ReactElement> = {
  guide: () => (
    <div className={`${classBase}-guide`}>
      <div className={`${classBase}-guideToc`}>{lines(0, 6, 110, 7, 14)}</div>
      <div className={`${classBase}-guidePage`}>
        <Sk style={{ background: "var(--sc-text-2)", height: 10, left: 0, top: 4, width: 140 }} />
        {lines(0, 26, 260, 3, 11)}
        <Sk kind="box" style={{ height: 50, left: 0, top: 66, width: "100%" }} />
      </div>
    </div>
  ),
  page: () => (
    <>
      <Sk kind="box" style={{ height: 112, left: 22, top: 18, width: "calc(100% - 44px)" }} />
      <Sk kind="accent" style={{ height: 14, left: 22, opacity: 0.3, top: 18, width: "calc(100% - 44px)" }} />
      {lines(32, 42, 220, 6, 13)}
    </>
  ),
  theme: () => (
    <div className={`${classBase}-swatches`}>
      {["purple", "green"].flatMap((hue) =>
        SWATCH_SHADES.map((shade) => (
          <div
            className={`${classBase}-swatch`}
            key={`${hue}-${shade}`}
            style={{ background: `var(--salt-color-${hue}-${shade})` }}
          />
        )),
      )}
    </div>
  ),
};

export const AreaArt = ({ variant }: { variant: AreaArtVariant }) => {
  const Sketch = areaSketches[variant];
  return (
    <div aria-hidden className={classBase}>
      <Sketch />
    </div>
  );
};

export const StartHereArtwork = ({ art }: { art: StartHereArt }) => {
  const Sketch = startHereSketches[art];
  return (
    <div aria-hidden className={classBase}>
      <Sketch />
    </div>
  );
};
