import "@finos/vuu-icons/index.css";
import "@finos/vuu-theme/index.css";

import { AppRoutes } from "./AppRoutes";
import { ExamplesModule } from "./showcase-utils";

export const Showcase = ({ exhibits }: { exhibits: ExamplesModule }) => {
  return <AppRoutes stories={exhibits} />;
};
