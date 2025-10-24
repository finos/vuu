import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useEffect, useState } from "react";
import cx from "clsx";
import { DataSource } from "@vuu-ui/vuu-data-types";

import frozenBannerCss from "./FrozenBanner.css";

const classBase = "FrozenBanner";

const formatFreezeTime = (ts: number) => {
  const date = new Date(ts);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export interface FrozenBannerProps extends HTMLAttributes<HTMLDivElement> {
  dataSource: DataSource;
}

export const FrozenBanner = ({
  dataSource,
  className,
  ...htmlAttributes
}: FrozenBannerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-frozen-banner",
    css: frozenBannerCss,
    window: targetWindow,
  });

  const [isFrozen, setIsFrozen] = useState(dataSource.isFrozen ?? false);
  const [freezeTime, setFreezeTime] = useState<number | undefined>(
    dataSource.freezeTimestamp,
  );

  useEffect(() => {
    const handleFreezeChange = (frozen: boolean, timestamp?: number) => {
      setIsFrozen(frozen);
      setFreezeTime(timestamp);
    };

    setIsFrozen(dataSource.isFrozen ?? false);
    setFreezeTime(dataSource.freezeTimestamp);

    dataSource.on("freeze", handleFreezeChange);

    return () => {
      dataSource.removeListener("freeze", handleFreezeChange);
    };
  }, [dataSource]);

  if (!isFrozen) {
    return null;
  }

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      Frozen at {freezeTime ? formatFreezeTime(freezeTime) : "--:--"}
    </div>
  );
};
