import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, ReactNode } from "react";
import {
  DatasourceStatsHookProps,
  useDatasourceStats,
} from "./useDatasourceStats";

import dataSourceStats from "./DatasourceStats.css";

export type ItemLabel =
  | string
  | {
      singlular: string;
      plural: string;
    };

export interface DataSourceStatsProps
  extends DatasourceStatsHookProps,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * children will be displayed when selection present. Intended
   * use case is display of action button(s) that will operate on
   * selected rows.
   */
  children?: ReactNode;
  /**
   * Label will be used in display of selected row count, e.g
   * '6 trades selected', where 'trade' is the itemLabel, will
   *  default to 'row'
   */
  itemLabel?: ItemLabel;

  selectionActions?: ReactNode;
  tooltrayActions?: ReactNode;
}

const classBase = "vuuDatasourceStats";

const numberFormatter = new Intl.NumberFormat();

const getLabel = (label: ItemLabel, count = 1) => {
  if (count === 1) {
    return typeof label === "string" ? label : label.singlular;
  } else {
    return typeof label === "string" ? `${label}s` : label.plural;
  }
};

export const DataSourceStats = ({
  children,
  className,
  dataSource,
  itemLabel = "row",
  showFreezeStatus = true,
  showRowStats = true,
  showSelectionStats = true,
  tooltrayActions,
  ...htmlAttributes
}: DataSourceStatsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-datasource-stats",
    css: dataSourceStats,
    window: targetWindow,
  });

  const { freezeTime, range, selectedCount, size } = useDatasourceStats({
    dataSource,
    showFreezeStatus,
    showRowStats,
    showSelectionStats,
  });

  const from = numberFormatter.format(range.firstRowInViewport);
  const to = numberFormatter.format(Math.min(range.lastRowInViewport, size));
  const value = numberFormatter.format(size);
  const showSelection = showSelectionStats && selectedCount > 0;

  if (size === 0) {
    return (
      <div {...htmlAttributes} className={cx(classBase, className)}>
        <span className={`${classBase}-label`}>No Rows to display</span>
      </div>
    );
  } else {
    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, className, {
          [`${classBase}-withSelection`]: showSelection,
        })}
      >
        {showRowStats ? (
          <div className={`${classBase}-statsPanel ${classBase}-rowStats`}>
            <span className={`${classBase}-label`}>Row count</span>
            <span className={`${classBase}-range`}>
              <span className={`${classBase}-value`}>{from}</span>
              <span className={`${classBase}-label`}>-</span>
              <span className={`${classBase}-value`}>{to}</span>
            </span>
            <span className={`${classBase}-label`}>of</span>
            <span className={`${classBase}-value`}>{value}</span>
          </div>
        ) : null}
        {showFreezeStatus && freezeTime !== undefined ? (
          <div className={`${classBase}-statsPanel ${classBase}-freezeStatus`}>
            <span
              className={`${classBase}-label`}
            >{`(frozen at ${freezeTime})`}</span>
          </div>
        ) : null}
        {showSelection ? (
          <div
            className={`${classBase}-statsPanel ${classBase}-selectionStats`}
          >
            <span className={`${classBase}-value`}>{selectedCount}</span>
            <span
              className={`${classBase}-label`}
            >{`selected ${getLabel(itemLabel, selectedCount)}`}</span>
            <span className={`${classBase}-actions`}>{children}</span>
          </div>
        ) : null}
        {tooltrayActions ? (
          <div className={`${classBase}-statsPanel ${classBase}-tooltray`}>
            <span className={`${classBase}-actions`}>{tooltrayActions}</span>
          </div>
        ) : null}
      </div>
    );
  }
};
