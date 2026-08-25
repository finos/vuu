module.exports = {
  name: "Vuu Playwright component coverage",
  outputDir: "./playwright/coverage",
  reports: ["v8", "v8-json", "html", "lcovonly", "text-summary"],
  sourceFilter: {
    "**/node_modules/**": false,
    "**/playwright/gallery/**": false,
    "**/showcase/**": false,
    "**/packages/**": true,
  },
};
