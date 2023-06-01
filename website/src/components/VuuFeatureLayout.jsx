import React, { useCallback, useContext, useState } from "react";

import "./VuuFeatureLayout.css";

const FeatureContext = React.createContext();

export const useFeatureContext = (id) => {
  return useContext(FeatureContext);
};

const Separator = () => {
  return <div className="vuuFeatureLayout-separator" />;
};

export const VuuFeatureLayout = ({ children }) => {
  const [activeFeatureId, setActiveFeatureId] = useState(-1);
  const toggleFeature = useCallback(
    (featureId) => {
      console.log(`toggle ${featureId} current active = ${activeFeatureId}`);
      if (featureId === activeFeatureId) {
        console.log(`set to -1`);
        setActiveFeatureId(-1);
      } else {
        setActiveFeatureId(featureId);
      }
    },
    [activeFeatureId]
  );

  return (
    <FeatureContext.Provider value={{ activeFeatureId, toggleFeature }}>
      <div className="vuuFeatureLayout">
        {React.Children.toArray(children).reduce((elements, child, i) => {
          i > 0 && elements.push(<Separator />);
          elements.push(child);
          return elements;
        }, [])}
      </div>
    </FeatureContext.Provider>
  );
};
