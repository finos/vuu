import "./Showcase.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ShowcaseShell } from "./showcase-main/ShowcaseShell";
import { THEME_ID } from "./showcase-main/tree-nav/nav-tree";
import { WORKSPACES_PATH } from "./showcase-main/workspace/workspace-model";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { ReactElement } from "react";
import type { ExhibitImporter } from "./shared-utils";

const createRoutes = (treeSource: TreeSourceNode[]): ReactElement[] =>
  treeSource.reduce<ReactElement[]>((routes, { childNodes, label, id }) => {
    return Array.isArray(childNodes)
      ? routes
          .concat(createRoutes(childNodes))
          .concat(<Route key={id} path={id} element={label} />)
      : routes.concat(<Route key={id} path={id} />);
  }, []);

export const Showcase = ({
  importExhibit,
  treeSource,
}: {
  importExhibit?: ExhibitImporter;
  treeSource: TreeSourceNode[];
}) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ShowcaseShell
              importExhibit={importExhibit}
              treeSource={treeSource}
            />
          }
        >
          {createRoutes(treeSource)}
          <Route path={THEME_ID} />
          <Route path={`${WORKSPACES_PATH.slice(1)}/:workspaceId`} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
