import {
  GridComponentRendererRegistry,
  type GridComponentSettingsCodec,
  GridComponentSettingsRegistry,
  type GridLayoutDocument,
} from "@heswell/grid-layout";

export interface ShowcasePanelSettings {
  readonly background: string;
  readonly color?: string;
  readonly label: string;
}

export const isShowcasePanelSettings = (
  value: unknown,
): value is ShowcasePanelSettings =>
  typeof value === "object" &&
  value !== null &&
  "background" in value &&
  typeof value.background === "string" &&
  "label" in value &&
  typeof value.label === "string" &&
  (!("color" in value) || typeof value.color === "string");

const panelCodec: GridComponentSettingsCodec<ShowcasePanelSettings> = {
  decode: (value) =>
    isShowcasePanelSettings(value)
      ? { ok: true, value }
      : {
          error: {
            code: "INVALID_SHOWCASE_PANEL",
            message: "panel background and label must be strings",
            path: "$",
          },
          ok: false,
        },
  encode: (settings) => ({ ok: true, value: settings }),
  isSettings: isShowcasePanelSettings,
  version: 1,
};

export const showcaseGridSettingsCodecs = new GridComponentSettingsRegistry();
showcaseGridSettingsCodecs.register("showcase-panel", panelCodec);

export const showcaseGridComponentRenderers =
  new GridComponentRendererRegistry();
showcaseGridComponentRenderers.register(
  "showcase-panel",
  isShowcasePanelSettings,
  ({ background, color = "white", label }, componentId) => (
    <div
      data-component-id={componentId}
      style={{
        alignItems: "center",
        background,
        color,
        display: "flex",
        height: "100%",
        justifyContent: "center",
      }}
    >
      {label}
    </div>
  ),
);

export const panelComponent = (
  id: string,
  label: string,
  background: string,
  color?: string,
) => ({
  id,
  settings: { background, ...(color ? { color } : {}), label },
  type: "showcase-panel",
  version: 1,
});

export const showcaseDocument = (
  document: GridLayoutDocument,
): GridLayoutDocument => document;
