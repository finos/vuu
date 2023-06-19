import { HTMLAttributes } from "react";
import cx from "classnames";
import "./ColumnMenu.css";

export const ColumnMenu = ({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => {
  return <span {...props} className={cx("vuuTable-columnMenu", className)} />;
};
