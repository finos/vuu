import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import appStatusBarCss from "./AppStatusBar.css";
import { useUserSetting } from "../application-provider";
import { Settings } from "@finos/vuu-utils";
import { ConnectionStatusIndicator } from "../connection-status";

const classBase = "vuuAppStatusBar";

const shouldShowStatusBar = (settings?: Settings) => {
  if (settings && "showAppStatusBar" in settings) {
    return settings.showAppStatusBar === true;
  }
};

export const ApplicationStatusBar = () => {
  const settings = useUserSetting();
  console.log({ settings });

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-settings-form",
    css: appStatusBarCss,
    window: targetWindow,
  });

  if (!shouldShowStatusBar(settings)) {
    return <div className={cx(classBase, `${classBase}-hidden`)} />;
  }

  return (
    <div className={classBase}>
      <ConnectionStatusIndicator />
    </div>
  );
};
