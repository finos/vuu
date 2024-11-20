import "./Showcase.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { App } from "./showcase-main/App";
import { TreeSourceNode } from "@finos/vuu-utils";

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
        <Route path="/" element={<App treeSource={treeSource} />}>
          {createRoutes(treeSource)}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
