import "./Showcase.css";

import React, { BrowserRouter, Route, Routes } from "react-router-dom";
import { ShowcaseShell } from "./showcase-main/ShowcaseShell";
import { THEME_ID } from "./showcase-main/tree-nav/nav-tree";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { ReactElement } from "react";

const createRoutes = (treeSource: TreeSourceNode[]): ReactElement[] =>
  treeSource.reduce<ReactElement[]>((routes, { childNodes, label, id }) => {
    return Array.isArray(childNodes)
      ? routes
          .concat(createRoutes(childNodes))
          .concat(<Route key={label} path={id} element={label} />)
      : routes.concat(<Route key={label} path={id} />);
  }, []);

export const Showcase = ({ treeSource }: { treeSource: TreeSourceNode[] }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShowcaseShell treeSource={treeSource} />}>
          {createRoutes(treeSource)}
          <Route path={THEME_ID} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
