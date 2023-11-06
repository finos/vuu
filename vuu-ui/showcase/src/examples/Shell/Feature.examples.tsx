import { Feature } from "@finos/vuu-shell";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { SyntheticEvent, useMemo, useState } from "react";
import { getSchema } from "@finos/vuu-data-test";

let displaySequence = 1;

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

  const schema = getSchema("instruments");

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    setSelectedIndex(parseInt(value));
  };

  const { cssUrl, jsUrl } = useMemo(() => {
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
        <ToggleButtonGroup onChange={handleChange} value={selectedIndex}>
          <ToggleButton value={0}>Test aqua</ToggleButton>
          <ToggleButton value={1}>Test yellow</ToggleButton>
          <ToggleButton value={2}>Vuu Blotter (Mock Data)</ToggleButton>
          <ToggleButton value={3}>Child Orders</ToggleButton>
          <ToggleButton value={4}>Prices</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <Feature css={cssUrl} ComponentProps={{}} url={jsUrl} />;
      </div>
    </div>
  );
};
DefaultFeature.displaySequence = displaySequence++;
