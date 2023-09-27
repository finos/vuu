import { LayoutProvider, View } from "@finos/vuu-layout";
import { Feature, FeatureProps, useLayoutManager } from "@finos/vuu-shell";
import { useCallback, useEffect } from "react";
import { FilterTableFeature } from "../../features/FilterTable.feature";
import { useTableSchema } from "../utils";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import { registerComponent } from "@finos/vuu-layout";

registerComponent("FilterTableFeature", FilterTableFeature, "view");

let displaySequence = 1;

export const DefaultFilterTableFeature = () => {
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
        <FilterTableFeature tableSchema={schema} />
      </View>
    </LayoutProvider>
  );
};
DefaultFilterTableFeature.displaySequence = displaySequence++;

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePropsForEnv: Record<Environment, FeatureProps> = {
  development: {
    url: "/src/features/FilterTable.feature",
  },
  production: {
    url: "/features/TableNext.feature.js",
    css: "/features/TableNext.feature.css",
  },
};

export const FilterTableFeatureAsFeature = () => {
  const { url, css } = featurePropsForEnv[env];
  const tableSchema = useTableSchema("instruments");

  return <Feature ComponentProps={{ tableSchema }} url={url} css={css} />;
};
FilterTableFeatureAsFeature.displayName = "FilterTable";
FilterTableFeatureAsFeature.displaySequence = displaySequence++;
