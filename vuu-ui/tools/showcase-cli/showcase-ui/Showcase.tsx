import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { App } from "./App";
import type { ExhibitsJson } from "./exhibit-utils";

import "./Showcase.css";
import { TreeSourceNode } from "@finos/vuu-utils";

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

export const Showcase = ({
  exhibits,
  treeSource,
}: {
  exhibits: ExhibitsJson;
  treeSource: TreeSourceNode[];
}) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<App exhibits={exhibits} treeSource={treeSource} />}
        >
          {createRoutes(exhibits)}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
