// The Showcase chrome is always rendered with Vuu styling, hence we always need the Vuu theme
import "./themes/vuu-theme";

import "./Showcase.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ExamplesModule } from "./showcase-utils";
import { App } from "./App";

const createRoutes = (examples: ExamplesModule, prefix = ""): JSX.Element[] =>
  Object.entries(examples)
    .filter(([path]) => path !== "default")
    .reduce<JSX.Element[]>((routes, [label, Value]) => {
      const id = `${prefix}${label}`;
      return typeof Value === "object"
        ? routes
            .concat(<Route key={label} path={id} element={label} />)
            .concat(createRoutes(Value, `${id}/`))
        : routes.concat(<Route key={label} path={id} />);
    }, []);

export const Showcase = ({ exhibits }: { exhibits: ExamplesModule }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App stories={exhibits} />}>
          {createRoutes(exhibits)}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
