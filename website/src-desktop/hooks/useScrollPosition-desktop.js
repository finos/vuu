/**
 * Desktop useScrollPosition
 */

import { useCallback, useEffect } from "react";

const FULL_LOGO_HEIGHT = 90;
const FULL_LOGO_WIDTH = 185;
const SMALL_LOGO_HEIGHT = 60;
const SMALL_LOGO_WIDTH = 140;

export const useScrollPosition = () => {
  const scrollListener = useCallback(() => {
    const root = document.querySelector(":root");
    const scrollTop = Math.round(window.scrollY);
    // console.log(`scrollY = ${scrollY}`);
    if (scrollTop < 130) {
      const height = Math.max(72, 200 - scrollTop);
      root.style.setProperty("--vuu-navbar-height", `${height}px`);
    } else {
      root.style.setProperty("--vuu-navbar-height", `72px`);
    }

    root.style.setProperty(
      "--vuu-navbar-background-position",
      `${-scrollTop}px`
    );

    if (scrollTop < 120) {
      root.style.setProperty("--vuu-navbar-menu-top", "30px");
    } else if (scrollTop >= 120 && scrollTop < 146) {
      const menuTop = Math.max(15, 6 - (scrollTop - 120));
      root.style.setProperty("--vuu-navbar-menu-top", `${menuTop}px`);
    } else {
      root.style.setProperty("--vuu-navbar-menu-top", "15px");
    }

    if (scrollTop < 81) {
      const padding = Math.max(80 - scrollTop, 6);
      // console.log(`padding ${padding}`);
      root.style.setProperty("--vuu-navbar-padding", `${padding}px`);
      root.style.setProperty("--vuu-navbar-shadow", "none");
    } else {
      root.style.setProperty("--vuu-navbar-padding", "6px");
      root.style.setProperty(
        "--vuu-navbar-shadow",
        "0px 3px 6px rgba(0, 0, 0, 0.2)"
      );
    }

    if (scrollTop > 100) {
      root.style.setProperty(
        "--vuu-navbar-logo-height",
        `${SMALL_LOGO_HEIGHT}px`
      );
      root.style.setProperty(
        "--vuu-navbar-logo-width",
        `${SMALL_LOGO_WIDTH}px`
      );
    } else if (scrollTop > 60 && scrollTop < 101) {
      const scrollPct = (scrollTop - 60) / 40;
      const maxHeightDiff = FULL_LOGO_HEIGHT - SMALL_LOGO_HEIGHT;
      const maxWidthDiff = FULL_LOGO_WIDTH - SMALL_LOGO_WIDTH;
      const heightAdjustment = Math.round(scrollPct * maxHeightDiff);
      const widthAdjustment = Math.round(scrollPct * maxWidthDiff);
      console.log(`scrtoll reduction = ${scrollPct}%`);
      // const size = LOGO_SIZE - (scrollTop - 60);
      root.style.setProperty(
        "--vuu-navbar-logo-height",
        `${FULL_LOGO_HEIGHT - heightAdjustment}px`
      );
      root.style.setProperty(
        "--vuu-navbar-logo-width",
        `${FULL_LOGO_WIDTH - widthAdjustment}px`
      );
    } else if (scrollTop <= 60) {
      // prettier-ignore
      root.style.setProperty("--vuu-navbar-logo-height",`${FULL_LOGO_HEIGHT}px`);
      root.style.setProperty("--vuu-navbar-logo-width", `${FULL_LOGO_WIDTH}px`);
    }

    if (scrollTop > 80) {
      root.style.setProperty(
        "--vuu-navbar-bg",
        `var(--vuu-dark-bg-background2)`
      );
    } else {
      root.style.setProperty("--vuu-navbar-bg", `transparent`);
    }
  }, []);

  useEffect(() => {
    addEventListener("scroll", scrollListener);
    return () => {
      removeEventListener("scroll", scrollListener);
      const root = document.querySelector(":root");
      root.style.setProperty("--vuu-navbar-height", null);
      root.style.setProperty("--vuu-navbar-padding", null);
      root.style.setProperty("--vuu-navbar-logo-size", null);
    };
  }, []);
};
