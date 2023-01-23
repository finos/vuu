module.exports = {
  mainSidebar: {
    "Main Menu": [
      "introduction/intro",
      {
        type: "category",
        label: "Getting Started",
        items: [
          "getting_started/developing",
          "getting_started/adding",
          "getting_started/using_vuu_from_java",
          "getting_started/configuration",
        ],
        link: {
          type: "doc",
          id: "getting_started/getting_started",
        },
      },
      {
        type: "category",
        label: "Core Concepts",
        items: [
          "providers_tables_viewports/lifecycle",
          "providers_tables_viewports/providers",
          "providers_tables_viewports/tables",
          "providers_tables_viewports/viewports",
          "providers_tables_viewports/filter_sort",
          "providers_tables_viewports/modules",
        ],
        link: {
          type: "doc",
          id: "providers_tables_viewports/providers_tables_viewports",
        },
      },
      {
        type: "category",
        label: "Trees and Session Tables",
        items: ["trees/trees", "trees/tree_builder", "trees/aggregates"],
        link: {
          type: "doc",
          id: "trees/trees_session_tables",
        },
      },
      {
        type: "category",
        label: "Server Internals",
        items: [
          "server_internals/tickpath",
          "server_internals/viewport_thread",
          "server_internals/join_manager",
        ],
        link: {
          type: "doc",
          id: "server_internals/server_internals",
        },
      },
      {
        type: "category",
        label: "Remote Procedure Calls",
        items: ["rpc/service", "rpc/Menu_items"],
        link: {
          type: "doc",
          id: "rpc/rpc",
        },
      },
      {
        type: "category",
        label: "Wire Protocol",
        items: ["wire/viewport_ack_nack"],
        link: {
          type: "doc",
          id: "wire/wire_protocol",
        },
      },
      {
        type: "category",
        label: "The UI",
        items: [
          "ui/fluid_ui",
          "ui/grid",
          "ui/visual_linking",
          "ui/custom_controls",
          "ui/calculated_columns",
        ],

        link: {
          type: "doc",
          id: "ui/ui",
        },
      },
      {
        type: "category",
        label: "Performance Optimisation",
        items: ["perf/indices", "perf/query_planner"],
        link: {
          type: "doc",
          id: "perf/performance_optimization",
        },
      },
      {
        type: "category",
        label: "Security",
        items: ["security/authentication", "security/authorisation"],
        link: {
          type: "doc",
          id: "security/security",
        },
      },
      {
        type: "category",
        label: "New Features - RFC",
        items: ["rfc/conditional_formatting"],
      },
      {
        type: "category",
        label: "FAQ",
        items: ["faq/debugging_json_messages"],
        link: {
          type: "doc",
          id: "faq/faq",
        },
      },
      "team",
      "roadmap",
      "about-finos",
    ],
  },
};
