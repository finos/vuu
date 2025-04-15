import React, { useMemo } from "react";
import { Density, ThemeMode } from "@finos/vuu-utils";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  const src = useMemo(() => {
    const src = `${location.pathname}?standalone&theme=${theme}#themeMode=${themeMode},density=${density}`;
    return src;
  }, [density, location.pathname, theme, themeMode]);

  return (
    <div className="ShowCaseIFrame-container">
      <iframe className="ShowCaseIFrame" src={src} title={"inside"}></iframe>
    </div>
  );
};
