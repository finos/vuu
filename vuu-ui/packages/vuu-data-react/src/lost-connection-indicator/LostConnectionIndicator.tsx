import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import workspaceNotificationCss from "./LostConnectionIndicator.css";

const classBase = "vuuLostConnectionIndicator";

export const LostConnectionIndicator = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: workspaceNotificationCss,
    window: targetWindow,
  });

  return (
    <div className={classBase}>
      <h2 className={`${classBase}-title`}>CONNECTION LOST</h2>
      <div className={`${classBase}-spinner`} />
      <h3 className={`${classBase}-status`}>RECONNECTING</h3>
    </div>
  );
};
