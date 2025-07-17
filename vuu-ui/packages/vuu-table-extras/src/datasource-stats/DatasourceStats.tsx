import { DataSource } from "@vuu-ui/vuu-data-types";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";

import dataSourceStats from "./DatasourceStats.css";
import { formatDate, Range } from "@vuu-ui/vuu-utils";

interface DataSourceStatsProps extends HTMLAttributes<HTMLSpanElement> {
  dataSource: DataSource;
}

const classBase = "vuuDatasourceStats";

const numberFormatter = new Intl.NumberFormat();
const timeFormatter = formatDate({ time: "hh:mm:ss" });

const formatTime = (ts: number | undefined) => {
  if (typeof ts === "number") {
    return timeFormatter(new Date(ts));
  } else {
    return undefined;
  }
};

export const DataSourceStats = ({
  className: classNameProp,
  dataSource,
}: DataSourceStatsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-datasource-stats",
    css: dataSourceStats,
    window: targetWindow,
  });

  const [range, setRange] = useState<Range>(dataSource.range);
  const [size, setSize] = useState(dataSource.size);
  const [freezeTime, setFreezeTime] = useState(
    formatTime(dataSource.freezeTimestamp),
  );

  const handleFreeze = useCallback(
    (isFrozen: boolean, freezeTimestamp: number) => {
      console.log(`DatasourceStats isFrozen ${isFrozen}`);
      if (isFrozen) {
        setFreezeTime(formatTime(freezeTimestamp));
      } else {
        setFreezeTime(undefined);
      }
    },
    [],
  );

  useEffect(() => {
    setSize(dataSource.size);
    dataSource.on("resize", setSize);
    dataSource.on("range", setRange);
    dataSource.on("freeze", handleFreeze);
    return () => {
      dataSource.removeListener("resize", setSize);
      dataSource.removeListener("range", setRange);
    };
  }, [dataSource, handleFreeze]);

  const className = cx(classBase, classNameProp);
  const from = numberFormatter.format(range.firstRowInViewport);
  const to = numberFormatter.format(range.lastRowInViewport);
  const value = numberFormatter.format(size);

  if (size === 0) {
    return (
      <div className={className}>
        <span className={`${classBase}-label`}>No Rows to display</span>
      </div>
    );
  } else {
    return (
      <div className={className}>
        <span className={`${classBase}-label`}>Rows</span>
        <span className={`${classBase}-range`}>{from}</span>
        <span>-</span>
        <span className={`${classBase}-range`}>{to}</span>
        <span>of</span>
        <span className={`${classBase}-size`}>{value}</span>
        {freezeTime !== undefined ? (
          <span
            className={`${classBase}-label`}
          >{`(frozen at ${freezeTime})`}</span>
        ) : null}
      </div>
    );
  }
};
