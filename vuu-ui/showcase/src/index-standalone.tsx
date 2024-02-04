import { ShowcaseStandalone } from "@finos/vuu-showcase";
import ReactDOM from "react-dom";
import { getUrlParameter } from "@finos/vuu-utils";

const theme = getUrlParameter("theme", "vuu");

const root = document.getElementById("root") as HTMLDivElement;

ReactDOM.render(
  <ShowcaseStandalone
    density="high"
    theme={theme}
    themeMode="light"
  ></ShowcaseStandalone>,
  root
);
