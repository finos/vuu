import { Component, registerComponent } from "@finos/vuu-layout";

export const Brown = (style: React.CSSProperties | undefined) => {
  return <Component style={{ ...style, backgroundColor: "brown" }} />;
};

registerComponent("Brown", Brown);
