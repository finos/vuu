import { createShowcaseRsbuilds } from "./rsbuild.ts";

const outputDirectory = new URL(
  "../../../showcase/.showcase/dev",
  import.meta.url,
).pathname;
const { host, remote } = await createShowcaseRsbuilds(true, outputDirectory);

await remote.build({ watch: true });
await host.startDevServer();
