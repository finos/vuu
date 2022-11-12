import React from "react";
import ReactDOM from "react-dom";
import { AppRoutes } from "./AppRoutes";
import * as stories from "./examples/core";
ReactDOM.render(
  <AppRoutes stories={stories} />,
  document.getElementById("root")
);
