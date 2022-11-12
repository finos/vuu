import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { App } from "./App";

import "@vuu-ui/vuu-theme/index.css";
import "@heswell/component-anatomy/esm/index.css";

import "./index.css";

const createRoutes = (stories, prefix = "") =>
  Object.entries(stories)
    .filter(([path]) => path !== "default")
    .reduce((routes, [label, Value]) => {
      const id = `${prefix}${label}`;
      return typeof Value === "object"
        ? routes
            .concat(<Route key={label} path={id} element={label} />)
            .concat(createRoutes(Value, `${id}/`))
        : routes.concat(<Route key={label} path={id} element={<Value />} />);
    }, []);

export const AppRoutes = ({ stories }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App stories={stories} />}>
        {createRoutes(stories)}
      </Route>
    </Routes>
  </BrowserRouter>
);
