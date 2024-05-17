import { Component } from "@finos/vuu-layout";
import { registerComponent } from "@finos/vuu-utils";

export const Red = (style: React.CSSProperties | undefined) => {
  return <Component style={{ ...style, backgroundColor: "red" }} />;
};

registerComponent("Red", Red, "component");
