import http from "http";

export const startHTTPServer = () => {
  const server = http.createServer((request, response) => {
    response.write(`
    <html>
      <head>
        <title>Stevo</title>
        <script type="module" src="http://localhost:1337/@vite/client"></script>
        <script type="module" src="http://localhost:1337/src/examples/main.js"></script>     
      </head>
      <body>  
      Hey There
      </body>
    </html>
        `);
    response.end();
  });

  server.listen(3100);
};
