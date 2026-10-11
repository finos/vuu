export default `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vuu Showcase</title>
    <script type="module">
      import React from "react";
      import {createRoot} from "react-dom/client";
      import {
        DocsStandalone,
        isStandaloneDocument,
        Showcase,
        ShowcaseStandalone,
      } from "@vuu-ui/vuu-showcase";
      import { hasUrlParameter } from "@vuu-ui/vuu-utils";
      const { default: treeSource } = await import("/treeSourceJson.js");
      const container = document.getElementById("root");
      const root = createRoot(container);
      if (hasUrlParameter("standalone")) {
        const Standalone = isStandaloneDocument(treeSource)
          ? DocsStandalone
          : ShowcaseStandalone;
        root.render(React.createElement(Standalone, { treeSource }));
      } else {
        root.render(React.createElement(Showcase, { treeSource }));
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
