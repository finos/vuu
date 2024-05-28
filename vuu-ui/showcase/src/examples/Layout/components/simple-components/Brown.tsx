import { Component } from "@finos/vuu-layout";
import { registerComponent } from "@finos/vuu-utils";

export const Brown = (style: React.CSSProperties | undefined) => {
  return <Component style={{ ...style, backgroundColor: "brown" }} />;
};

registerComponent("Brown", Brown, "component");
