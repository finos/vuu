import React from "react";
import { FlexboxLayout as Flexbox, Placeholder } from "@vuu-ui/vuu-layout";

export const twoColumns = (
  <Flexbox style={{ flexDirection: "column" }}>
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
  </Flexbox>
);
