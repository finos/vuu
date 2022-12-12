import React from "react";
import { Component, registerComponent } from "@vuu-ui/vuu-layout";

export const Brown = ({ style }) => {
  return <Component style={{ ...style, backgroundColor: "brown" }} />;
};

registerComponent("Brown", Brown);
