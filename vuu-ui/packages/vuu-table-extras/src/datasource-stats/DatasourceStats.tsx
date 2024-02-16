import { DataSource } from "@finos/vuu-data-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import cx from "clsx";
import { HTMLAttributes, useEffect, useState } from "react";

import "./DatasourceStats.css";

interface DataSourceStatsProps extends HTMLAttributes<HTMLSpanElement> {
  dataSource: DataSource;
}

const classBase = "vuuDatasourceStats";

const numberFormatter = new Intl.NumberFormat();

export const DataSourceStats = ({
  className: classNameProp,
  dataSource,
}: DataSourceStatsProps) => {
  const [range, setRange] = useState<VuuRange>(dataSource.range);
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
  const from = numberFormatter.format(range.from + 1);
  const to = numberFormatter.format(Math.min(range.to, size));
  const value = numberFormatter.format(size);
  return (
    <div className={className}>
      <span className={`${classBase}-label`}>Row count</span>
      <span className={`${classBase}-range`}>{from}</span>
      <span>-</span>
      <span className={`${classBase}-range`}>{to}</span>
      <span>of</span>
      <span className={`${classBase}-size`}>{value}</span>
    </div>
  );
};
