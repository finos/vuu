import { getSchema } from "@finos/vuu-data-test";
import {
  FlexboxLayout,
  LayoutProvider,
  registerComponent,
  View,
} from "@finos/vuu-layout";
import { Feature, FeatureProps, useLayoutManager } from "@finos/vuu-shell";
import { useCallback, useState } from "react";
import { FilterTableFeature } from "../../features/FilterTable.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import { JsonTable } from "@finos/vuu-datatable";
import type { JsonData } from "@finos/vuu-utils";

registerComponent("FilterTableFeature", FilterTableFeature, "view");

let displaySequence = 1;

export const DefaultFilterTableFeature = () => {
  const schema = getSchema("instruments");

  //-----------------------------------------------------------------------------------
  // Note the following functionality is provided by the Shell in a full application.
  // Likewise the Shell provides the LayoutProvider wrapper. Again, in a full Vuu
  // application, the Palette wraps each feature in a View.
  //-----------------------------------------------------------------------------------
  const { applicationJson: applicationLayout, saveApplicationLayout } =
    useLayoutManager();

  // Save layout into state so we can display in JsonTable
  const [savedLayoutJson, setSavedLayoutJson] = useState(applicationLayout);

  const handleLayoutChange = useCallback(
    (layout) => {
      saveApplicationLayout(layout);
      setSavedLayoutJson(layout);
    },
    [saveApplicationLayout]
  );
  // ----------------------------------------------------------------------------------

  return (
    <div style={{ display: "flex" }}>
      <LayoutProvider
        layout={applicationLayout.applicationLayout}
        onLayoutChange={handleLayoutChange}
      >
        <View
          Header={VuuBlotterHeader}
          id="table-next-feature"
          className="vuuTableFeature"
          closeable
          header
          title="Instruments"
          style={{ width: 700, height: 500 }}
        >
          <FilterTableFeature tableSchema={schema} />
        </View>
      </LayoutProvider>
      <div style={{ flex: "1 1 auto" }}>
        <JsonTable
          config={{
            columnSeparators: true,
            rowSeparators: true,
            zebraStripes: true,
          }}
          source={savedLayoutJson as unknown as JsonData}
        />
      </div>
    </div>
  );
};
DefaultFilterTableFeature.displaySequence = displaySequence++;

export const FilterTableFeatureFlexBox = () => {
  const schema = getSchema("instruments");

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <View
          Header={VuuBlotterHeader}
          id="table-next-feature-0"
          className="vuuTableFeature"
          closeable
          header
          resizeable
          title="Instruments"
          style={{ flex: 1 }}
        >
          <FilterTableFeature tableSchema={schema} />
        </View>
        <View
          Header={VuuBlotterHeader}
          id="table-next-feature"
          className="vuuTableFeature-1"
          closeable
          header
          resizeable
          title="Instruments"
          style={{ flex: 1 }}
        >
          <FilterTableFeature tableSchema={schema} />
        </View>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
FilterTableFeatureFlexBox.displaySequence = displaySequence++;

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
  const tableSchema = getSchema("instruments");

  return (
    <View
      Header={VuuBlotterHeader}
      id="table-next-feature"
      className="vuuTableFeature"
      closeable
      header
      title="Instruments"
      style={{ width: 700, height: 500 }}
    >
      <Feature ComponentProps={{ tableSchema }} url={url} css={css} />
    </View>
  );
};
FilterTableFeatureAsFeature.displayName = "FilterTable";
FilterTableFeatureAsFeature.displaySequence = displaySequence++;
