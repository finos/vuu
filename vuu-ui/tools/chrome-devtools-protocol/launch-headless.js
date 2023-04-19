import chromeLauncher from "chrome-launcher";
import CDP from "chrome-remote-interface";
import { writeJsonFileFile } from "../../scripts/utils.mjs";

// Optional: set logging level of launcher to see its output.
// Install it using: npm i --save lighthouse-logger
// const log = require('lighthouse-logger');
// log.setLevel('info');

/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless = false) {
  return chromeLauncher.launch({
    // port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      "--window-size=412,732",
      "--disable-gpu",
      headless ? "--headless" : "",
    ],
  });
}

// launchChrome().then(async (chrome) => {
//   console.log(`Chrome debuggable on port: ${chrome.port}`);
//   const version = await CDP.Version({ port: chrome.port });
//   console.log(version["User-Agent"]);
//   const protocol = await CDP({port: chrome.port});

//   chrome.kill();
// });

(async function () {
  const chrome = await launchChrome();
  const protocol = await CDP({ port: chrome.port });

  // Extract the DevTools protocol domains we need and enable them.
  // See API docs: https://chromedevtools.github.io/devtools-protocol/
  const { Page, Tracing } = protocol;
  await Page.enable();

  // const manifest = await Page.getAppManifest();

  // if (manifest.url) {
  //   console.log("Manifest: " + manifest.url);
  //   console.log(manifest.data);
  // } else {
  //   console.log("Site has no app manifest");
  // }

  // const categories = await Tracing.getCategories();
  // console.log({ categories });

  const config = {
    tracing: {
      traceConfig: {
        includedCategories: [
          "-*",
          "devtools.timeline",
          "v8.execute",
          "disabled-by-default-devtools.timeline",
          "disabled-by-default-devtools.timeline.frame",
          "toplevel",
          "blink.console",
          "blink.user_timing",
          "latencyInfo",
          "disabled-by-default-devtools.timeline",
          "disabled-by-default-devtools.timeline.frame",
          "disabled-by-default-devtools.timeline.stack",
          "disabled-by-default-devtools.screenshot",
          "disabled-by-default-v8.cpu_profiler",
        ],
        //   excludedCategories: ["-*"],
      },
    },
    cdpPort: 9222,
    maxTimeout: 50000,
  };

  let data = [];

  Tracing.dataCollected((evt) => {
    data = data.concat(evt.value);
  });

  Tracing.tracingComplete((evt) => {
    console.log({ evt });
  });

  //   await Tracing.start(config.tracing);
  await Tracing.start({
    traceConfig: {
      includedCategories: [
        "disabled-by-default-devtools.timeline",
        "disabled-by-default-devtools.timeline.frame",
      ],
      excludedCategories: ["__metadata"],
    },
  });

  Page.navigate({
    url: "http://127.0.0.1:5173/Table/Table/DefaultTable?standalone",
  });

  Page.loadEventFired(async () => {
    console.log("page loaded");
  });

  setTimeout(async () => {
    console.log("timed out");
    await Tracing.end();
    await Tracing.tracingComplete();
    protocol.close();
    chrome.kill();
    writeJsonFileFile(data, "./trace.json");
  }, 1000);
})();
