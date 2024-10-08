import ReactDOM from "react-dom";
import React from "react";
import { Showcase } from "./Showcase";

const root = document.getElementById("root") as HTMLDivElement;
// The full Showcase shell loads all examples in order to render the Navigation Tree. This can
// be a bit slow in dev mode.
ReactDOM.render(<Showcase exhibits={{}} />, root);
