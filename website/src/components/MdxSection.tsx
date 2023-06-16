import React, { HTMLAttributes } from "react";
import cx from "classnames";
import Link from "@docusaurus/Link";

import "./MdxSection.css";

const classBase = "vuuMdxSection";

export interface MdxSectionProps {
  className?: "vuu-section-2-col-1" | "vuu-section-2-col-2";
  subTitle: string;
  title: string;
  titleLink: string;
}

export const MdxSection = ({
  className,
  subTitle,
  title,
  titleLink,
}: MdxSectionProps) => {
  return (
    <div className={cx("vuuMdxSection", className)}>
      <div className={`${classBase}-heading`}>
        <div className={`${classBase}-icon`} />
        <Link className={`${classBase}-title vuu-heading-5`} to={titleLink}>
          {title}
        </Link>
      </div>
      <div className={`${classBase}-subTitle`}>{subTitle}</div>
    </div>
  );
};
