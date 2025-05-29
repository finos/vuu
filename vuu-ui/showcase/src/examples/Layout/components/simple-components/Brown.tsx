import { Component } from "@vuu-ui/vuu-layout";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const Brown = (style: React.CSSProperties | undefined) => {
  return <Component style={{ ...style, backgroundColor: "brown" }} />;
};

registerComponent("Brown", Brown, "component");
