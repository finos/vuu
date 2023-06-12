// Docs at https://v2.docusaurus.io/docs/configuration

// Replace 'project-blueprint' with {project name}
const projectName = "VUU";
// Replace 'project-blueprint' with {project name}
const projectSlug = "vuu";
// Replace 'FINOS' with {name of copyright owner}
const copyrightOwner = "UBS";

module.exports = {
  title: `FINOS ${projectName}`,
  tagline: `FINOS ${projectName}`,
  url: "https://vuu.finos.org",
  baseUrl: "/",
  favicon: "img/favicon/vuu-logo-favicon.png",
  projectName: `FINOS ${projectName}`,
  organizationName: "FINOS",
  customFields: {
    repoUrl: `https://github.com/finos/${projectSlug}`,
  },
  scripts: ["https://buttons.github.io/buttons.js"],
  stylesheets: [
    "https://fonts.googleapis.com/css?family=Nunito+Sans:300,400,600,700&display=swap",
    "https://fonts.googleapis.com/css?family=Raleway:400,500&display=swap",
    "/css/DataAnimation.css",
  ],
  themeConfig: {
    navbar: {
      logo: {
        alt: "FINOS Logo",
        src: "img/vuu/Logo.svg",
      },
      items: [
        {
          to: "docs/introduction/intro",
          label: "DOCUMENTATION",
          position: "right",
        },
        { to: "docs/roadmap", label: "ROADMAP", position: "right" },
        {
          to: "https://github.com/finos/vuu",
          label: "GITHUB",
          position: "right",
        },
      ],
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          breadcrumbs: false,
          path: "../docs",
          editUrl: "https://github.com/finos/vuu/edit/master/website/",
          sidebarPath: require.resolve("./sidebars.js"),
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
