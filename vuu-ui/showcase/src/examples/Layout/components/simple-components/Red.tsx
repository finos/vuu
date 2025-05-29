import { Component } from "@vuu-ui/vuu-layout";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const Red = (style: React.CSSProperties | undefined) => {
  return <Component style={{ ...style, backgroundColor: "red" }} />;
};

registerComponent("Red", Red, "component");
