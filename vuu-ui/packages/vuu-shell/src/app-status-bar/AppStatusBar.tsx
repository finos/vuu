import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { ConnectionManager } from "@finos/vuu-data-remote";

import appStatusBarCss from "./AppStatusBar.css";
import { useUserSetting } from "../application-provider";
import { Settings } from "@finos/vuu-utils";
import { ConnectionStateDisplay } from "../connection-status";
import { useEffect, useState } from "react";
import { Button } from "@salt-ds/core";

const classBase = "vuuAppStatusBar";

const shouldShowStatusBar = (connected: boolean, settings?: Settings) => {
  if (settings && "showAppStatusBar" in settings) {
    return settings.showAppStatusBar === true || connected === false;
  } else {
    return connected === false;
  }
};

export const ApplicationStatusBar = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-settings-form",
    css: appStatusBarCss,
    window: targetWindow,
  });

  const [connected, setConnected] = useState(true);
  const settings = useUserSetting();

  useEffect(() => {
    ConnectionManager.on("connection-status", ({ connectionStatus }) => {
      if (connectionStatus === "disconnected") {
        setConnected(false);
      } else if (connectionStatus.endsWith("connected")) {
        setConnected(true);
      }
    });
  }, []);

  if (!shouldShowStatusBar(connected, settings)) {
    return <div className={cx(classBase, `${classBase}-hidden`)} />;
  }

  // const connect = () => {
  //   ConnectionManager.connect({
  //     token: "blah",
  //     url: "ws://localhost:8090/websocket",
  //     username: "steve",
  //   });
  // };
  // const disconnect = () => {
  //   ConnectionManager.disconnect();
  // };

  return (
    <div className={classBase}>
      {/* <Button onClick={disconnect}>Disconnect</Button>
      <Button onClick={connect}>Connect</Button> */}
      <ConnectionStateDisplay />
    </div>
  );
};
