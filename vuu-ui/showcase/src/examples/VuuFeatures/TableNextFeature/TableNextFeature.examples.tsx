import { LayoutProvider, View } from "@finos/vuu-layout";
import { Feature, FeatureProps, useLayoutConfig } from "@finos/vuu-shell";
import { useCallback } from "react";
import {
  TableNextFeature,
  TableNextFeatureProps,
} from "../../../features/TableNext.feature";
import { useTableSchema } from "../../utils";
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
  const [layout, saveLayoutConfig] = useLayoutConfig({
    // save to local storage. Use browser devtools to purge this
    saveLocation: "local",
  });

  const handleLayoutChange = useCallback(
    (layout) => {
      saveLayoutConfig(layout);
    },
    [saveLayoutConfig]
  );
  // ----------------------------------------------------------------------------------

  return (
    <LayoutProvider layout={layout} onLayoutChange={handleLayoutChange}>
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
    <View
      Header={VuuBlotterHeader}
      className="vuuTableNextFeature"
      closeable
      header
      title="Instruments"
      style={{ width: "100%", height: "100%" }}
    >
      <Feature<TableNextFeatureProps>
        ComponentProps={{
          schema,
        }}
        url={url}
        css={css}
      />
    </View>
  );
};
TableNextFeatureAsFeature.displaySequence = displaySequence++;
