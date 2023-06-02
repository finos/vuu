import React, { useCallback, useContext, useRef, useState } from "react";
import cx from "classnames";

import "./VuuFeatureLayout.css";

const FeatureContext = React.createContext();
const classBase = "vuuFeature";

const EMPTY_CONTEXT = { activeFeatureId: -1 };

export const useFeatureLayout = (id) => {
  const context = useContext(FeatureContext);
  if (context) {
    const { activeFeatureId, registerFeature } = context;
    registerFeature(id);
    const isActive = id === activeFeatureId;
    const isMinimised = !isActive && activeFeatureId !== -1;
    // return {
    // className: cx({
    //   [`${classBase}-active`]: id === 1,
    //   [`${classBase}-minimized`]: id > 1,
    //   [`${classBase}-swing-title`]: false,
    //   [`${classBase}-swing-all`]: id > 1,
    // }),
    return {
      className: cx({
        [`${classBase}-active`]: isActive,
        [`${classBase}-minimized`]: isMinimised,
        [`${classBase}-swing-title`]: isMinimised && id < activeFeatureId,
        [`${classBase}-swing-all`]:
          isMinimised && id > activeFeatureId && activeFeatureId > 1,
      }),
    };
  }
  return EMPTY_CONTEXT;
};

const Separator = () => {
  return <div className="vuuFeatureLayout-separator" />;
};

export const VuuFeatureLayout = ({ children }) => {
  const childIdRef = useRef([]);
  const [activeFeatureId, setActiveFeatureId] = useState(-1);
  const registerFeature = useCallback(
    (featureId) => {
      if (!childIdRef.current.includes(featureId)) {
        childIdRef.current.push(featureId);
      }
    },
    [activeFeatureId]
  );

  const handleExpand = useCallback((index) => {
    const featureId = childIdRef.current[index];
    if (featureId) {
      setActiveFeatureId(featureId);
    }
  }, []);

  const handleCollapse = useCallback((index) => {
    const featureId = childIdRef.current[index];
    if (featureId) {
      setActiveFeatureId(-1);
    }
  }, []);

  return (
    <FeatureContext.Provider value={{ activeFeatureId, registerFeature }}>
      <div className="vuuFeatureLayout">
        <div className="vuuFeatureLayout-container">
          {React.Children.toArray(children).reduce((elements, child, i) => {
            i > 0 && elements.push(<Separator key={`separator-${i}`} />);
            elements.push(child);
            return elements;
          }, [])}
        </div>
        <div className="vuuFeatureLayout-mouseTrap">
          {React.Children.toArray(children).map((child, i) => {
            return (
              <div
                key={i}
                className="vuuFeatureLayout-mouseTrap-zone"
                onMouseEnter={() => handleExpand(i)}
                onMouseLeave={() => handleCollapse(i)}
              />
            );
          }, [])}
        </div>
      </div>
    </FeatureContext.Provider>
  );
};
