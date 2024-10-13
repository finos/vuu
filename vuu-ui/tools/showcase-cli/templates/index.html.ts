export default `<html>
  <head>
    <title>Vuu Showcase</title>
    <link href="main.css" rel="stylesheet"></style>
    <script type="importmap">
    {
      "imports": {
        "exhibits:src/examples/Apps/SampleApp.examples.tsx": "http://localhost:1337/src/examples/Apps/SampleApp.examples.tsx"
      }
    }
    </script>
    <script type="module" src="http://localhost:1337/@vite/client"></script>
    <script type="module">
      const {default: exhibits} = await import("/exhibits.js");
      const {default: start} = await import("/main.js");
      start(exhibits)
    </script>
  </head>
  <body>
    <div id="root" />
  </body>
</html>
`;
