import React from "react";
import { Component, registerComponent } from "@finos/vuu-layout";

export const Brown = ({ style }) => {
  return <Component style={{ ...style, backgroundColor: "brown" }} />;
};

registerComponent("Brown", Brown);
