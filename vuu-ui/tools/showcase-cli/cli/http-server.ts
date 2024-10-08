import { Server, version, mime } from "node-static";
import http from "http";

export type HttpServerConfig = {
  port: number;
};

const defaultConfig: HttpServerConfig = {
  port: 3100,
};

console.log(`cwd: ${process.cwd()}`);

export const startHTTPServer = (config: HttpServerConfig = defaultConfig) => {
  const file = new Server("./.showcase");

  http
    .createServer(function (request, response) {
      request
        .addListener("end", function () {
          //
          // Serve files!
          //
          file.serve(request, response);
        })
        .resume();
    })
    .listen(3100);
};
// export const startHTTPServer = (config: HttpServerConfig = defaultConfig) => {
//   const server = http.createServer((request, response) => {
//     const { url } = request;
//     console.log({ url });
//     response.write(`
//     <html>
//       <head>
//         <title>Stevo</title>
//         <script type="module" src="http://localhost:1337/@vite/client"></script>
//         <script type="module" src="http://localhost:1337/src/examples/main.js"></script>
//       </head>
//       <body>
//       Hey There
//       </body>
//     </html>
//         `);
//     response.end();
//   });

//   server.listen(config.port);
// };
