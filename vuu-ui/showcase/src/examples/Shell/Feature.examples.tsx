import { Feature } from "@finos/vuu-shell";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useMemo, useState } from "react";
import { useTableSchema } from "../utils";

type PathMap = { [key: string]: { jsUrl: string; cssUrl?: string } };

const componentPaths: { [key: string]: PathMap } = {
  development: {
    Test: {
      jsUrl: "/src/features/Test.feature",
    },
    VuuBlotterMockData: {
      jsUrl: "/src/features/VuuBlotterMockData.feature",
    },
  },
  production: {
    Test: {
      jsUrl: "/features/Test.feature.js",
      cssUrl: "/features/Test.feature.css",
    },
    VuuBlotterMockData: {
      jsUrl: "/features/VuuBlotterMockData.feature.js",
      cssUrl: "/features/VuuBlotterMockData.feature,css",
    },
  },
};

type Environment = keyof typeof componentPaths;
const env = process.env.NODE_ENV as Environment;

export const DefaultFeature = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const schema = useTableSchema("instruments");

  const handleChange: ToggleButtonGroupChangeEventHandler = (_event, index) => {
    console.log({ index });
    setSelectedIndex(index);
  };

  const { cssUrl, jsUrl, params } = useMemo(() => {
    switch (selectedIndex) {
      case 0:
        return {
          ...componentPaths[env]["Test"],
          params: { background: "aqua" },
        };
      case 1:
        return {
          ...componentPaths[env]["Test"],
          params: { background: "yellow" },
        };
      case 2:
        return {
          ...componentPaths[env]["VuuBlotterMockData"],
          params: { schema },
        };
      default:
        return componentPaths[env]["Test"];
    }
  }, [schema, selectedIndex]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "0 0 24px" }}>
        <ToggleButtonGroup
          onChange={handleChange}
          selectedIndex={selectedIndex}
        >
          <ToggleButton>Test aqua</ToggleButton>
          <ToggleButton>Test yellow</ToggleButton>
          <ToggleButton>Vuu Blotter (Mock Data)</ToggleButton>
          <ToggleButton>Child Orders</ToggleButton>
          <ToggleButton>Prices</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <Feature css={cssUrl} params={params} url={jsUrl} />;
      </div>
    </div>
  );
};
