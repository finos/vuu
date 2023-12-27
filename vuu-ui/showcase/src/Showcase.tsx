import { AppRoutes } from "./AppRoutes";
import { ExamplesModule } from "./showcase-utils";

export const Showcase = ({ exhibits }: { exhibits: ExamplesModule }) => {
  return <AppRoutes stories={exhibits} />;
};
