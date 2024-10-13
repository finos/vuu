import { createServer } from "vite";
import { HttpServerConfig, startHTTPServer } from "./http-server";

export type ShowcaseConfig = {
  exhibits: string;
  "http-server"?: HttpServerConfig;
  version: string;
};

export default async (config: ShowcaseConfig) => {
  // fs.writeFile(OUT, JSON.stringify(stories, null, 2), (err) => {
  //   if (err) {
  //     console.log(err);
  //   }
  // });

  const server = await createServer({
    build: {
      manifest: true,
      polyfillModulePreload: false,
      rollupOptions: {
        input: "./src/examples/main.js",
      },
    },

    server: {
      port: 1337,
    },
  });

  await server.listen();

  server.printUrls();

  const { ["http-server"]: serverConfig } = config;
  startHTTPServer(serverConfig);
};
