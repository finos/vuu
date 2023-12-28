import { ShowcaseStandalone } from "./ShowcaseStandalone";
import ReactDOM from "react-dom";
import { getUrlParameter } from "@finos/vuu-utils";

import "./index.css";

const theme = getUrlParameter("theme", "vuu");

switch (theme) {
  case "vuu":
    import("./themes/vuu").then(renderApp);
    break;
  case "salt":
    import("./themes/salt").then(renderApp);
    break;
  default:
    renderApp();
}

function renderApp() {
  const root = document.getElementById("root") as HTMLDivElement;

  ReactDOM.render(
    <ShowcaseStandalone
      density="high"
      theme={theme}
      themeMode="light"
    ></ShowcaseStandalone>,
    root
  );
}
