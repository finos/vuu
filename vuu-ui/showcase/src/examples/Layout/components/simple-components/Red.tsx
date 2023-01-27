import { Component, registerComponent } from "@finos/vuu-layout";

export const Red = (style: React.CSSProperties | undefined) => {
  return <Component style={{ ...style, backgroundColor: "red" }} />;
};

registerComponent("Red", Red);
