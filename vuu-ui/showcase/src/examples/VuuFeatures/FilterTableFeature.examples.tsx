import { getSchema } from "@vuu-ui/vuu-data-test";
import { FlexboxLayout, LayoutProvider, View } from "@vuu-ui/vuu-layout";
import { Feature } from "@vuu-ui/vuu-shell";
import FilterTableFeature from "../../features/FilterTable.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import { type DynamicFeatureProps, registerComponent } from "@vuu-ui/vuu-utils";

registerComponent("FilterTableFeature", FilterTableFeature, "view");

/** tags=data-consumer */
export const DefaultFilterTableFeature = () => {
  const schema = getSchema("instruments");

  return (
    <div style={{ height: "100%" }}>
      <LayoutProvider>
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
    </div>
  );
};

/** tags=data-consumer */
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

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePropsForEnv: Record<Environment, DynamicFeatureProps> = {
  development: {
    url: "/src/features/FilterTable.feature",
  },
  production: {
    url: "/features/TableNext.feature.js",
    css: "/features/TableNext.feature.css",
  },
};

/** tags=data-consumer */
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
