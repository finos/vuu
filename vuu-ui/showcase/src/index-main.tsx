import ReactDOM from "react-dom";
import { type ExamplesModule, Showcase } from "@finos/vuu-showcase";

const root = document.getElementById("root") as HTMLDivElement;
// The full Showcase shell loads all examples in order to render the Navigation Tree. This can
// be a bit slow in dev mode.
import("./examples/index")
  .then((examples: ExamplesModule) => {
    ReactDOM.render(<Showcase exhibits={examples} />, root);
  })
  .catch((err) => console.error(`error loading examples ${err.message}`));
