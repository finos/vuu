// The Showcase chrome is always rendered with Vuu styling, hence we always need the Vuu theme
import "./themes/vuu";

import "./Showcase.css";

import { AppRoutes } from "./AppRoutes";
import { ExamplesModule } from "./showcase-utils";

export const Showcase = ({ exhibits }: { exhibits: ExamplesModule }) => {
  return <AppRoutes stories={exhibits} />;
};
