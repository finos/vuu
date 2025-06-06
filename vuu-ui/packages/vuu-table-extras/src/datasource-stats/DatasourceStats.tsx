import { DataSource } from "@vuu-ui/vuu-data-types";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useEffect, useState } from "react";

import dataSourceStats from "./DatasourceStats.css";
import { Range } from "@vuu-ui/vuu-utils";

interface DataSourceStatsProps extends HTMLAttributes<HTMLSpanElement> {
  dataSource: DataSource;
}

const classBase = "vuuDatasourceStats";

const numberFormatter = new Intl.NumberFormat();

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
  useEffect(() => {
    setSize(dataSource.size);
    dataSource.on("resize", setSize);
    dataSource.on("range", setRange);
    return () => {
      dataSource.removeListener("resize", setSize);
      dataSource.removeListener("range", setRange);
    };
  }, [dataSource]);

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
      </div>
    );
  }
};
