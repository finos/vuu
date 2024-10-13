import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { App } from "./App";
import { ExamplesModule } from "./showcase-utils";

import "./Showcase.css";
import { ExhibitsJson } from "./exhibit-utils";

const createRoutes = (examples: ExhibitsJson, prefix = ""): JSX.Element[] =>
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

export const Showcase = ({ exhibits }: { exhibits: ExhibitsJson }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App exhibits={exhibits} />}>
          {createRoutes(exhibits)}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
