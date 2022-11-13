import React from "react";
import { FlexboxLayout as Flexbox, Placeholder } from "@finos/vuu-layout";

export const twoColumns = (
  <Flexbox style={{ flexDirection: "column" }}>
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
  </Flexbox>
);
