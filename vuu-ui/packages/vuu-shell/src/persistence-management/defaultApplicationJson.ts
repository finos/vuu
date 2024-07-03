import { ApplicationJSON, LayoutJSON } from "@finos/vuu-utils";

export const warningLayout: LayoutJSON = {
  type: "View",
  props: {
    style: { height: "calc(100% - 6px)" },
  },
  children: [
    {
      props: {
        className: "vuuShell-warningPlaceholder",
      },
      type: "Placeholder",
    },
  ],
};

export const loadingApplicationJson: Readonly<ApplicationJSON> = {
  layout: {
    type: "Component",
    id: "loading-main",
    props: {},
  },
};

export const defaultApplicationJson: ApplicationJSON = {
  layout: {
    type: "Stack",
    id: "main-tabs",
    props: {
      className: "vuuShell-mainTabs",
      TabstripProps: {
        allowAddTab: true,
        allowCloseTab: true,
        allowRenameTab: true,
        animateSelectionThumb: false,
        location: "main-tab",
        variant: "primary",
      },
      preserve: true,
      active: 0,
    },
    children: [
      {
        props: {
          id: "tab1",
          title: "Tab 1",
          className: "vuuShell-Placeholder",
        },
        type: "Placeholder",
      },
    ],
  },
};
