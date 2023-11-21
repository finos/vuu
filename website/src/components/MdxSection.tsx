import React from "react";
import Link from "@docusaurus/Link";

import "./MdxSection.css";

const classBase = "vuuMdxSection";

export const MdxSection = ({ subTitle, title, titleLink }) => {
  return (
    <div className="vuuMdxSection">
      <div className={`${classBase}-heading`}>
        <div className={`${classBase}-icon`} />
        <Link className={`${classBase}-title vuu-heading-5`} to={titleLink}>
          What is a Vuu Server?
        </Link>
      </div>
      <div className={`${classBase}-subTitle`}>{subTitle}</div>
    </div>
  );
};
