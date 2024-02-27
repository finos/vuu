import { Density, ThemeMode } from "@finos/vuu-utils";

export interface IFrameProps {
  theme?: string;
  themeMode?: ThemeMode;
  density?: Density;
}

export const IFrame = ({
  theme = "vuu",
  themeMode = "light",
  density = "high",
}: IFrameProps) => {
  const src = `${location.href}?standalone&theme=${theme}#themeMode=${themeMode},density=${density}`;
  return (
    <div className="ShowCaseIFrame-container">
      <iframe className="ShowCaseIFrame" src={src} title={"inside"}></iframe>
    </div>
  );
};
