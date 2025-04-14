export default `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vuu Showcase</title>
    <script type="module">
      import React from "react";
      import ReactDOM from "react-dom";
      import { Showcase, ShowcaseStandalone } from "@finos/vuu-showcase";
      import { hasUrlParameter } from "@finos/vuu-utils";
      const { default: treeSource } = await import("/treeSourceJson.js");
      const root = document.getElementById("root");
      if (hasUrlParameter("standalone")) {
        ReactDOM.render(React.createElement(ShowcaseStandalone, { treeSource }), root);
      } else {
        ReactDOM.render(React.createElement(Showcase, { treeSource }), root);
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
