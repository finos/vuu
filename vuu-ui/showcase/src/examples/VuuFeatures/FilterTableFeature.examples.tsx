import { getSchema } from "@vuu-ui/vuu-data-test";
import { FlexboxLayout, LayoutProvider, View } from "@vuu-ui/vuu-layout";
import FilterTableFeature from "../../features/FilterTable.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import { DemoTableContainer } from "../Table/DemoTableContainer";


/** tags=data-consumer */
export const DefaultFilterTableFeature = () => {
  const schema = getSchema("parentOrders");

  return (
    <div style={{ height: "100%" }}>
      <DemoTableContainer>
        <View
          Header={VuuBlotterHeader}
          id="table-next-feature"
          className="vuuTableFeature"
          closeable
          header
          title="Instruments"
        >
          <FilterTableFeature tableSchema={schema} />
        </View>
      </DemoTableContainer>
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


