import { buildPackageTree } from "./buildPackageTree";
import { createServer } from "vite";
import { startHTTPServer } from "./http-server";

export type ShowcaseConfig = {
  exhibits: string;
  version: string;
};

export default async (config: ShowcaseConfig) => {
  const start = performance.now();
  const stories = buildPackageTree(config.exhibits);
  const end = performance.now();
  console.log(`building exhibits menu took ${end - start}ms`);
  console.log(JSON.stringify(stories, null, 2));
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

  startHTTPServer();
};
