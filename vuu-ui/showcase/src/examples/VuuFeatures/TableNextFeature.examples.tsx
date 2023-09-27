import { LayoutProvider, View } from "@finos/vuu-layout";
import { Feature, FeatureProps, useLayoutManager } from "@finos/vuu-shell";
import { useCallback, useEffect } from "react";
import { TableNextFeature } from "../../features/TableNext.feature";
import { useTableSchema } from "../utils";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import { registerComponent } from "@finos/vuu-layout";

registerComponent("TableNextFeature", TableNextFeature, "view");

let displaySequence = 1;

export const DefaultTableNextFeature = () => {
  const schema = useTableSchema("instruments");

  //-----------------------------------------------------------------------------------
  // Note the following functionality is provided by the Shell in a full application.
  // Likewise the Shell provides the LayoutProvider wrapper. Again, in a full Vuu
  // application, the Palette wraps each feature in a View.
  //-----------------------------------------------------------------------------------
  const {currentLayout, saveCurrentLayout} = useLayoutManager();

  useEffect(() => {
    console.log(`%clayout changed`, "color: blue; font-weight: bold;");
  }, [currentLayout]);

  const handleLayoutChange = useCallback(
    (layout) => {
      console.log("layout change");
      saveCurrentLayout(layout);
    },
    [saveCurrentLayout]
  );
  // ----------------------------------------------------------------------------------

  return (
    <LayoutProvider layout={currentLayout} onLayoutChange={handleLayoutChange}>
      <View
        Header={VuuBlotterHeader}
        id="table-next-feature"
        className="vuuTableNextFeature"
        closeable
        header
        title="Instruments"
        style={{ width: 700, height: 500 }}
      >
        <TableNextFeature schema={schema} />
      </View>
    </LayoutProvider>
  );
};
DefaultTableNextFeature.displaySequence = displaySequence++;

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePropsForEnv: Record<Environment, FeatureProps> = {
  development: {
    url: "/src/features/TableNext.feature",
  },
  production: {
    url: "/features/TableNext.feature.js",
    css: "/features/TableNext.feature.css",
  },
};

export const TableNextFeatureAsFeature = () => {
  const { url, css } = featurePropsForEnv[env];
  const schema = useTableSchema("instruments");

  return (
    <Feature
      ComponentProps={{
        schema,
      }}
      url={url}
      css={css}
    />
  );
};
TableNextFeatureAsFeature.displayName = "FilterTable";
TableNextFeatureAsFeature.displaySequence = displaySequence++;
