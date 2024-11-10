import { ShowcaseStandalone } from "@finos/vuu-showcase";
import ReactDOM from "react-dom";

export default (exhibits: unknown) => {
  const root = document.getElementById("root") as HTMLDivElement;
  ReactDOM.render(<ShowcaseStandalone />, root);
};
