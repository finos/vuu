import React, { useCallback, useMemo } from "react";
import { useFeatureLayout } from "./VuuFeatureLayout";
import cx from "classnames";

import "./VuuFeature.css";

let featureId = 1;

const classBase = "vuuFeature";
const NO_CONTEXT = { activeFeatureId: -1, registerFeature: () => undefined };

export const VuuFeature = ({
  className: classNameProp,
  DetailImg,
  Img,
  children,
  title,
}) => {
  const id = useMemo(() => featureId++, []);
  const { className } = useFeatureLayout(id) ?? NO_CONTEXT;
  return (
    <div className={cx(classBase, className, classNameProp)}>
      <div className={`${classBase}-main`}>
        {Img ? (
          <div className={`${classBase}-heroImg-container`}>
            <img src={Img} alt="VUU" className={`${classBase}-heroImg`} />
          </div>
        ) : null}
        <div className={cx(`${classBase}-title`, "vuu-heading-3")}>{title}</div>
        <div className={cx(`${classBase}-title-vertical`, "vuu-heading-3")}>
          {title}
        </div>
        <div className={cx(`${classBase}-copy`, "vuu-paragraph-medium")}>
          {children}
        </div>
      </div>
      {DetailImg ? (
        <div className={`${classBase}-animation-container`}>
          <div className={`${classBase}-animation-bg`}></div>
          <img src={DetailImg} alt="VUU" className={`${classBase}-detailImg`} />
          <div className={`${classBase}-animation-shadow`}></div>
        </div>
      ) : null}
    </div>
  );
};
