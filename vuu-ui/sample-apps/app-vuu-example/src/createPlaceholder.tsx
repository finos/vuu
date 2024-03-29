import { Placeholder, View } from "@finos/vuu-layout";

export const createPlaceholder = (index?: number) => (
  // Note make this width 100% and height 100% and we get a weird error where view continually resizes - growing
  <View
    resizeable
    title={`Tab ${index}`}
    style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }}
    closeable
  >
    <Placeholder style={{ flex: 1 }} />
  </View>
);
