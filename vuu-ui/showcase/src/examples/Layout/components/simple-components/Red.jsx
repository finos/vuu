import React from "react";
import { Component, registerComponent } from "@finos/vuu-layout";

export const Red = ({ style }) => {
  return <Component style={{ ...style, backgroundColor: "red" }} />;
};

registerComponent("Red", Red);
