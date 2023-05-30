import React, { useCallback, useMemo } from "react";
import { useFeatureContext } from "./VuuFeatureLayout";
import cx from "classnames";

import "./VuuFeature.css";

let featureId = 1;

const classBase = "vuuFeature";

export const VuuFeature = ({ Img, children, title }) => {
  const id = useMemo(() => featureId++, []);
  const { activeFeatureId, toggleFeature } = useFeatureContext(id);
  const handleClick = useCallback(() => {
    toggleFeature(id);
  }, [toggleFeature]);
  return (
    <div
      className={cx(classBase, {
        [`${classBase}-active`]: id === activeFeatureId,
        [`${classBase}-minimized`]:
          id !== activeFeatureId && activeFeatureId !== -1,
      })}
      onClick={handleClick}
    >
      <div className={`${classBase}-main`}>
        <div className={`${classBase}-heroImg-container`}>
          <img src={Img} alt="VUU" className={`${classBase}-heroImg`} />
        </div>
        <div className="vuu-feature-title">
          <div className={cx(`${classBase}-title`, "vuu-heading-3")}>
            {title}
          </div>
        </div>
        <div className={cx(`${classBase}-copy`, "vuu-paragraph-medium")}>
          {children}
        </div>
      </div>
      <div className={`${classBase}-animation-container`} />
    </div>
  );
};
