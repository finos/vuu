import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ReactNode } from "react";

import portalLandingPageCss from "./PortalLandingPage.css";

const classBase = "vuuPortalLandingPage";

export interface PortalLandingPageProps {
  children?: ReactNode;
}

export const PortalLandingPage = ({ children }: PortalLandingPageProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-landing-page",
    css: portalLandingPageCss,
    window: targetWindow,
  });

  return <div className={classBase}>{children}</div>;
};
