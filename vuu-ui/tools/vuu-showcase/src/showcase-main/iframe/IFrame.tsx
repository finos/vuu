import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useShowcaseContext } from "../ShowcaseProvider";

export const IFrame = () => {
  const { dataLocation, density, theme, themeMode } = useShowcaseContext();
  const location = useLocation();
  const src = useMemo(() => {
    const src = `${location.pathname}?standalone&theme=${theme}#themeMode=${themeMode},density=${density},dataLocation=${dataLocation}`;
    return src;
  }, [dataLocation, density, location.pathname, theme, themeMode]);

  return (
    <div className="ShowCaseIFrame-container">
      <iframe className="ShowCaseIFrame" src={src} title={"inside"}></iframe>
    </div>
  );
};
