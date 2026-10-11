import { type ReactNode } from "react";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import { useShowcaseContext } from "../ShowcaseProvider";
import { ChromeSelect } from "./ChromeSelect";
import { DataSourceSelect } from "./DataSourceSelect";
import {
  DENSITIES,
  type Density,
  THEME_OPTIONS,
  type ThemeMode,
  VIEWPORT_PRESETS,
  type ViewportPreset,
} from "./preview-state";

import "./PreviewBar.css";

const classBase = "ShowcasePreviewBar";

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const themeOptions = THEME_OPTIONS.map(({ label, value }) => ({
  icon: <span className={`${classBase}-swatch`} data-theme={value} />,
  label,
  value,
}));

const modes: { icon: ChromeIconName; label: string; value: ThemeMode }[] = [
  { icon: "sun", label: "Light", value: "light" },
  { icon: "moon", label: "Dark", value: "dark" },
];

const viewports: Record<ViewportPreset, { icon: ChromeIconName; label: string }> =
  {
    fill: { icon: "fill", label: "Fill available space" },
    "1440": { icon: "monitor", label: "Desktop, 1440px" },
    "1024": { icon: "laptop", label: "Laptop, 1024px" },
    "768": { icon: "tablet", label: "Tablet, 768px" },
  };

export interface PreviewBarProps {
  /** show the data source control, for examples that consume data */
  dataConsumer?: boolean;
  onReload: () => void;
  onToggleSourceDock?: () => void;
  sourceDockOpen?: boolean;
  /** url of the content rendered standalone, opened in a new window */
  standaloneHref: string;
  /** examples can be sized within the canvas, documents always fill */
  viewportControls?: boolean;
}

const Separator = () => <span className={`${classBase}-separator`} />;

const Group = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className={`${classBase}-group`}>
    <span className="ShowcaseControlLabel">{label}</span>
    {children}
  </div>
);

/**
 * Controls the preview: theme, mode, density, data source and viewport.
 * Values are held in the url, see preview-state.ts.
 */
export const PreviewBar = ({
  dataConsumer = false,
  onReload,
  onToggleSourceDock,
  sourceDockOpen,
  standaloneHref,
  viewportControls = false,
}: PreviewBarProps) => {
  const { preview, setPreview } = useShowcaseContext();

  return (
    <div className={classBase} role="toolbar" aria-label="Preview settings">
      <Group label="Theme">
        <ChromeSelect
          aria-label="Theme"
          onChange={(theme) => setPreview({ theme })}
          options={themeOptions}
          value={preview.theme}
        />
        <div className="ShowcaseSegmented" role="group" aria-label="Mode">
          {modes.map(({ icon, label, value }) => (
            <button
              aria-label={label}
              aria-pressed={preview.mode === value}
              className="ShowcaseIconButton"
              key={value}
              onClick={() => setPreview({ mode: value })}
              title={`${label} mode`}
              type="button"
            >
              <ChromeIcon name={icon} size={15} />
            </button>
          ))}
        </div>
      </Group>
      <Separator />
      <Group label="Density">
        <div className="ShowcaseSegmented" role="group" aria-label="Density">
          {DENSITIES.map((density: Density) => (
            <button
              aria-pressed={preview.density === density}
              key={density}
              onClick={() => setPreview({ density })}
              type="button"
            >
              {capitalise(density)}
            </button>
          ))}
        </div>
      </Group>
      {dataConsumer ? (
        <>
          <Separator />
          <Group label="Data">
            <DataSourceSelect
              onChange={(ds) => setPreview({ ds })}
              value={preview.ds}
            />
          </Group>
        </>
      ) : null}

      <div className={`${classBase}-end`}>
        {viewportControls ? (
          <div className="ShowcaseSegmented" role="group" aria-label="Viewport">
            {VIEWPORT_PRESETS.map((vp) => (
              <button
                aria-label={viewports[vp].label}
                aria-pressed={preview.vp === vp}
                className="ShowcaseIconButton"
                key={vp}
                onClick={() => setPreview({ vp })}
                title={viewports[vp].label}
                type="button"
              >
                <ChromeIcon name={viewports[vp].icon} size={15} />
              </button>
            ))}
          </div>
        ) : null}
        {onToggleSourceDock ? (
          <button
            aria-label="Show source"
            aria-pressed={sourceDockOpen}
            className="ShowcaseIconButton"
            onClick={onToggleSourceDock}
            title="Show source below the preview"
            type="button"
          >
            <ChromeIcon name="source-panel" />
          </button>
        ) : null}
        <button
          aria-label="Reload"
          className="ShowcaseIconButton"
          onClick={onReload}
          title="Reload"
          type="button"
        >
          <ChromeIcon name="refresh" />
        </button>
        <a
          aria-label="Open in new window"
          className="ShowcaseIconButton"
          href={standaloneHref}
          rel="noopener"
          target="_blank"
          title="Open in new window"
        >
          <ChromeIcon name="external" />
        </a>
      </div>
    </div>
  );
};
