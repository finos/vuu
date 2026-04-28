import { ReactNode, useMemo, useState } from "react";

const checkCssToken = (tokenName: string): Promise<boolean> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      const saltSpacing100 = getComputedStyle(
        document.documentElement,
      ).getPropertyValue(tokenName);
      resolve(saltSpacing100 !== "");
    });
  });

/**
 * Checks that a theme is loaded by making sure a known css variable
 * returns a value. Not normally needed except for cases where a theme
 * is loaded dynamically on startup and there may be components that
 * may fail if theme is not in place (eg component that rely on taking dom
 * measurements).
 * Used by Showcase.
 */
export const ThemeLoadChecker = ({
  children,
  cssToken = "--salt-spacing-100",
  theme,
}: {
  children: ReactNode;
  cssToken?: string;
  theme: string;
}) => {
  const [ready, setReady] = useState(false);

  useMemo(async () => {
    let ready = await checkCssToken(cssToken);
    while (!ready) {
      ready = await checkCssToken(cssToken);
    }
    setReady(true);
  }, [cssToken]);

  if (theme === "no-theme") {
    return children;
  }

  if (ready === false) {
    return null;
  }

  return children;
};
