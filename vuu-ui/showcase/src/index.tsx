import "@finos/vuu-icons/index.css";
import "@finos/vuu-theme/index.css";
import { getUrlParameter, hasUrlParameter } from "@finos/vuu-utils";
import "@salt-ds/theme/index.css";
import ReactDOM from "react-dom";
import { addStylesheetURL } from "./utils";
import { ShowcaseStandalone } from "./ShowcaseStandalone";
import { Showcase } from "./Showcase";

import "./index.css";
import { ExamplesModule } from "./showcase-utils";

const themeName = getUrlParameter("theme", "salt");

const fontCssUrl =
  themeName === "salt"
    ? "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800&display=swap"
    : "https://fonts.googleapis.com/css?family=Nunito+Sans:300,400,500,600,700&display=swap";
addStylesheetURL(fontCssUrl);

const root = document.getElementById("root") as HTMLDivElement;

if (hasUrlParameter("standalone")) {
  ReactDOM.render(
    <ShowcaseStandalone
      density="high"
      theme={themeName}
      themeMode="light"
    ></ShowcaseStandalone>,
    root
  );
} else {
  import("./examples/index")
    .then((examples: ExamplesModule) => {
      ReactDOM.render(<Showcase exhibits={examples} />, root);
    })
    .catch((err) => console.error(`error loading examples ${err.message}`));
}
