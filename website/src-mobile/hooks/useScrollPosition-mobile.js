import { useCallback, useEffect } from "react";

const LOGO_SIZE = 90;

export const useScrollPosition = () => {
  const scrollListener = useCallback(() => {
    const root = document.querySelector(":root");
    const scrollTop = Math.round(window.scrollY);
    console.log(`scrollY = ${scrollY}`);
    if (scrollTop < 130) {
      const height = 200 - scrollTop;
      root.style.setProperty("--vuu-navbar-height", `${height}px`);
    }

    root.style.setProperty(
      "--vuu-navbar-background-position",
      `${-scrollTop}px`
    );

    if (scrollTop < 120) {
      root.style.setProperty("--vuu-navbar-menu-top", "26px");
    } else if (scrollTop >= 120 && scrollTop < 146) {
      const menuTop = Math.max(0, 26 - (scrollTop - 120));
      root.style.setProperty("--vuu-navbar-menu-top", `${menuTop}px`);
    } else {
      root.style.setProperty("--vuu-navbar-menu-top", "0px");
    }

    if (scrollTop < 81) {
      const padding = 80 - scrollTop;
      console.log(`padding ${padding}`);
      root.style.setProperty("--vuu-navbar-padding", `${padding}px`);
    }

    if (scrollTop > 60 && scrollTop < 101) {
      const size = LOGO_SIZE - (scrollTop - 60);
      root.style.setProperty("--vuu-navbar-logo-size", `${size}px`);
    } else if (scrollTop <= 60) {
      root.style.setProperty("--vuu-navbar-logo-size", `${LOGO_SIZE}px`);
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
