import React, { useCallback, useState } from "react";
// import { TerraceAlignment } from "../components/alignment-tools/terrace-with-alignment";

import { LayoutConfigurator as VuuLayoutConfigurator } from "@vuu-ui/vuu-layout";

export default {
  title: "Layout/Tools",
  component: VuuLayoutConfigurator,
};

export const LayoutConfigurator = () => {
  const [style, setStyle] = useState({
    width: 600,
    height: 300,
    flexDirection: "row",
    border: "2px solid black",
    margin: 3,
    padding: 12,
    backgroundColor: "#ccc",
  });

  const handleChange = useCallback((property, value) => {
    console.log(`change ${property} -> ${value}`);
    setStyle((currentStyle) => ({
      ...currentStyle,
      [property]: value,
    }));
  }, []);

  return (
    <div>
      <VuuLayoutConfigurator
        height={300}
        managedStyle={style}
        width={400}
        onChange={handleChange}
      />
    </div>
  );
};
