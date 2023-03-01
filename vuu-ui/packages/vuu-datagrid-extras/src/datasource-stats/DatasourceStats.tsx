import { OptimizeStrategy, RemoteDataSource } from "@finos/vuu-data";
import { HTMLAttributes, useEffect, useState } from "react";
import cx from "classnames";

import "./DatasourceStats.css";
import { VuuRange } from "@finos/vuu-protocol-types";

interface DataSourceStatsProps extends HTMLAttributes<HTMLSpanElement> {
  dataSource: RemoteDataSource;
}

const classBase = "vuuDatasourceStats";

const numberFormatter = new Intl.NumberFormat();

export const DataSourceStats = ({
  className: classNameProp,
  dataSource,
}: DataSourceStatsProps) => {
  const [optimize, setOptimize] = useState<OptimizeStrategy>(
    dataSource.optimize
  );
  const [range, setRange] = useState<VuuRange>(dataSource.range);
  const [size, setSize] = useState(dataSource.size);
  useEffect(() => {
    setOptimize(dataSource.optimize);
    setSize(dataSource.size);

    dataSource.on("optimize", setOptimize);
    dataSource.on("resize", setSize);
    dataSource.on("range", setRange);
  }, [dataSource]);

  const className = cx(classBase, classNameProp);
  const from = numberFormatter.format(range.from);
  const to = numberFormatter.format(range.to - 1);
  const value = numberFormatter.format(size);
  return (
    <div className={className}>
      <span>Showing rows</span>
      <span className={`${classBase}-range`}>{from}</span>
      <span className={`${classBase}-range`}>{to}</span>
      <span>of</span>
      <span className={`${classBase}-size`}>{value}</span>
      <span className={`${classBase}-optimize`}>{optimize}</span>
    </div>
  );
};
