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
    "https://fonts.googleapis.com/css?family=Overpass:400,400i,700",
  ],
  themeConfig: {
    navbar: {
      // title: `FINOS ${projectName}`,
      logo: {
        alt: "FINOS Logo",
        src: "img/favicon/vuu-logo.png",
      },
      items: [
        {
          to: "/",
          label: "HOME",
          position: "right",
        },

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
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} ${projectName} - ${copyrightOwner}`,
      logo: {
        alt: "FINOS Logo",
        src: "img/finos/vuu-text.png",
        href: "https://finos.org",
      },
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "docs/introduction/intro",
            },
            {
              label: "Roadmap",
              to: "docs/roadmap",
            },
            {
              label: "Team",
              to: "docs/team",
            },
            {
              label: "About FINOS",
              to: "docs/about-finos",
            },
          ],
        },
        {
          title: "FINOS",
          items: [
            {
              label: "FINOS Website",
              to: "https://www.finos.org",
            },
            {
              label: "Community Handbook",
              to: "https://community.finos.org",
            },
          ],
        },
        {
          title: "About FINOS",
          items: [
            {
              label: "FINOS Projects on GitHub",
              to: "https://github.com/finos",
            },
            {
              label: "Engage the FINOS Community",
              to: "https://www.finos.org/engage-with-our-community",
            },
            {
              label: "FINOS News and Events",
              to: "https://www.finos.org/news-and-events",
            },
          ],
        },
      ],
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
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
