import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useShowcaseContext } from "../ShowcaseProvider";

export const IFrame = () => {
  const { dataLocation, density, hostMode, theme, themeMode } =
    useShowcaseContext();
  const location = useLocation();
  const src = useMemo(() => {
    const anchor = new URLSearchParams(location.search).get("anchor");
    const anchorParam = anchor ? `&anchor=${encodeURIComponent(anchor)}` : "";
    const hostParam = hostMode ? `,host=${hostMode}` : "";
    const src = `${location.pathname}?standalone&theme=${theme}${anchorParam}#themeMode=${themeMode},density=${density},dataLocation=${dataLocation}${hostParam}`;
    return src;
  }, [
    dataLocation,
    density,
    hostMode,
    location.pathname,
    location.search,
    theme,
    themeMode,
  ]);

  return (
    <div className="ShowCaseIFrame-container">
      <iframe className="ShowCaseIFrame" src={src} title={"inside"}></iframe>
    </div>
  );
};
