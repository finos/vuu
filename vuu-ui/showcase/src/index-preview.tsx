import ReactDOM from "react-dom";
import { AppRoutes } from "./AppRoutes";
import * as stories from "./examples";

import "@finos/vuu-theme/index.css";
import "@heswell/component-anatomy/esm/index.css";

import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/300-italic.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/400-italic.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/500-italic.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/600-italic.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/open-sans/700-italic.css";
import "@fontsource/open-sans/800.css";
import "@fontsource/open-sans/800-italic.css";

import "./index.css";

ReactDOM.render(
  <AppRoutes stories={stories} />,
  document.getElementById("root")
);
