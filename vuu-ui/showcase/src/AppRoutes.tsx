import { BrowserRouter, Route, Routes } from "react-router-dom";
import { App } from "./App";

type ExamplesModule = typeof import("./examples/index");

import "./index.css";

const createRoutes = (stories: ExamplesModule, prefix = ""): JSX.Element[] =>
  Object.entries(stories)
    .filter(([path]) => path !== "default")
    .reduce<JSX.Element[]>((routes, [label, Value]) => {
      const id = `${prefix}${label}`;
      return typeof Value === "object"
        ? routes
            .concat(<Route key={label} path={id} element={label} />)
            .concat(createRoutes(Value, `${id}/`))
        : routes.concat(<Route key={label} path={id} />);
    }, []);

interface AppRoutesProps {
  stories: ExamplesModule;
}

export const AppRoutes = ({ stories }: AppRoutesProps) => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App stories={stories} />}>
        {createRoutes(stories)}
      </Route>
    </Routes>
  </BrowserRouter>
);
