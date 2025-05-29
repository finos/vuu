import "./Showcase.css";

import React, { BrowserRouter, Route, Routes } from "react-router-dom";
import { ShowcaseShell } from "./showcase-main/ShowcaseShell";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";

const createRoutes = (treeSource: TreeSourceNode[]): JSX.Element[] =>
  treeSource.reduce<JSX.Element[]>((routes, { childNodes, label, id }) => {
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
