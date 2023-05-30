import { useCallback, useEffect } from "react";

export const useScrollPosition = () => {
  const scrollListener = useCallback(() => {
    const scrollTop = window.scrollY;
    console.log(`scrollY = ${scrollY}`);
    if (scrollTop < 130) {
      const height = 200 - scrollTop;
      const root = document.querySelector(":root");
      root.style.setProperty("--vuu-navbar-height", `${height}px`);
    }
    if (scrollTop < 81) {
      const padding = 80 - scrollTop;
      const root = document.querySelector(":root");
      root.style.setProperty("--vuu-navbar-padding", `${padding}px`);
    }

    if (scrollTop > 60 && scrollTop < 101) {
      const size = 90 - (scrollTop - 60);
      const root = document.querySelector(":root");
      root.style.setProperty("--vuu-navbar-logo-size", `${size}px`);
    }

    if (scrollTop > 80) {
      const root = document.querySelector(":root");
      root.style.setProperty(
        "--vuu-navbar-bg",
        `var(--vuu-dark-bg-background2)`
      );
    } else {
      const root = document.querySelector(":root");
      root.style.setProperty("--vuu-navbar-bg", `transparent`);
    }
  }, []);

  useEffect(() => {
    console.log("add the listener");
    addEventListener("scroll", scrollListener);
    return () => removeEventListener("scroll", scrollListener);
  }, []);
};
