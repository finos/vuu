const classBase = "vuuTrafficLightControl";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import trafficLightCss from "./TrafficLightControl.css";

export type RagStatus = "red" | "amber" | "green";

export interface TrafficLightControlProps {
  flashing?: boolean;
  showText?: boolean;
  ragStatus: RagStatus | "unknown";
}
export const TrafficLightControl = ({
  flashing,
  ragStatus,
}: TrafficLightControlProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-traffic-light-control",
    css: trafficLightCss,
    window: targetWindow,
  });

  return (
    <div
      className={cx(classBase, `${classBase}-${ragStatus}`)}
      data-blinking={flashing}
    >
      <div className={`${classBase}-indicator`} />
      <div className={`${classBase}-indicator`} />
      <div className={`${classBase}-indicator`} />
    </div>
  );
};
