import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

import portalLogoCss from "./PortalLogo.css";

const classBase = "vuuPortalLogo";

export interface PortalLogoProps extends Omit<LinkProps, "children" | "to"> {
  /**
   * Accessible name of the link, also used as the alt text of an image logo.
   * Defaults to "Home".
   */
  alt?: string;
  /**
   * Logo content, e.g. an inline svg component. Takes precedence over src.
   */
  children?: ReactNode;
  /**
   * Url of a logo image.
   */
  src?: string;
  /**
   * Link target, defaults to the portal base url.
   */
  to?: LinkProps["to"];
}

/**
 * Displays a logo which is also a link back to the base portal url.
 */
export const PortalLogo = ({
  alt = "Home",
  children,
  className,
  src,
  to = "/",
  ...linkProps
}: PortalLogoProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-logo",
    css: portalLogoCss,
    window: targetWindow,
  });

  return (
    <Link
      aria-label={alt}
      {...linkProps}
      className={cx(classBase, className)}
      to={to}
    >
      {children ??
        (src ? (
          <img alt="" className={`${classBase}-image`} src={src} />
        ) : null)}
    </Link>
  );
};
