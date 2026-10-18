import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import type { ReactNode, SyntheticEvent } from "react";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import { useShowcaseContext } from "../ShowcaseProvider";
import { ChromeSelect } from "./ChromeSelect";
import { DataSourceSelect } from "./DataSourceSelect";
import {
  DENSITIES,
  type Density,
  type PreviewState,
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

const viewports: Record<
  ViewportPreset,
  { icon: ChromeIconName; label: string }
> = {
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
  /**
   * Preview settings and their change handler, by default those of the
   * showcase (held in the url). A workspace holds its own preview settings.
   */
  onPreviewChange?: (changes: Partial<PreviewState>) => void;
  preview?: Pick<PreviewState, "density" | "mode" | "theme"> &
    Partial<PreviewState>;
  /** additional controls, rendered at the start of the end group */
  endContent?: ReactNode;
  /** url of the content rendered standalone, opened in a new window */
  standaloneHref?: string;
  /** examples can be sized within the canvas, documents always fill */
  viewportControls?: boolean;
}

const valueOf = <T extends string>(e: SyntheticEvent<HTMLButtonElement>) =>
  e.currentTarget.value as T;

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
  endContent,
  onPreviewChange,
  onReload,
  onToggleSourceDock,
  sourceDockOpen,
  preview: previewProp,
  standaloneHref,
  viewportControls = false,
}: PreviewBarProps) => {
  const showcase = useShowcaseContext();
  const preview = previewProp ?? showcase.preview;
  const setPreview = onPreviewChange ?? showcase.setPreview;

  return (
    <div className={classBase} role="toolbar" aria-label="Preview settings">
      <Group label="Theme">
        <ChromeSelect
          aria-label="Theme"
          onChange={(theme) => setPreview({ theme })}
          options={themeOptions}
          value={preview.theme}
        />
        <ToggleButtonGroup
          aria-label="Mode"
          className={`${classBase}-segmented`}
          onChange={(e) => setPreview({ mode: valueOf<ThemeMode>(e) })}
          value={preview.mode}
        >
          {modes.map(({ icon, label, value }) => (
            <ToggleButton
              aria-label={label}
              className={`${classBase}-iconToggle`}
              key={value}
              title={`${label} mode`}
              value={value}
            >
              <ChromeIcon name={icon} size={15} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Group>
      <Separator />
      <Group label="Density">
        <ToggleButtonGroup
          aria-label="Density"
          className={`${classBase}-segmented`}
          onChange={(e) => setPreview({ density: valueOf<Density>(e) })}
          value={preview.density}
        >
          {DENSITIES.map((density: Density) => (
            <ToggleButton key={density} value={density}>
              {capitalise(density)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Group>
      {dataConsumer && preview.ds ? (
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
        {endContent}
        {viewportControls && preview.vp ? (
          <ToggleButtonGroup
            aria-label="Viewport"
            className={`${classBase}-segmented`}
            onChange={(e) => setPreview({ vp: valueOf<ViewportPreset>(e) })}
            value={preview.vp}
          >
            {VIEWPORT_PRESETS.map((vp) => (
              <ToggleButton
                aria-label={viewports[vp].label}
                className={`${classBase}-iconToggle`}
                key={vp}
                title={viewports[vp].label}
                value={vp}
              >
                <ChromeIcon name={viewports[vp].icon} size={15} />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : null}
        {onToggleSourceDock ? (
          <ToggleButton
            aria-label="Show source"
            className={`${classBase}-iconButton`}
            onChange={onToggleSourceDock}
            selected={sourceDockOpen ?? false}
            title="Show source below the preview"
            value="source"
          >
            <ChromeIcon name="source-panel" />
          </ToggleButton>
        ) : null}
        <Button
          appearance="transparent"
          aria-label="Reload"
          className={`${classBase}-iconButton`}
          onClick={onReload}
          title="Reload"
        >
          <ChromeIcon name="refresh" />
        </Button>
        {standaloneHref ? (
          <Button
            appearance="transparent"
            aria-label="Open in new window"
            className={`${classBase}-iconButton`}
            onClick={() => window.open(standaloneHref, "_blank", "noopener")}
            title="Open in new window"
          >
            <ChromeIcon name="external" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
