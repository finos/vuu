import { LayoutJSON } from "../layout-reducer";

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

export const defaultLayout: LayoutJSON = {
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
      tabClassName: "MainTab",
    },
    preserve: true,
    active: 0,
  },
  children: [
    {
      props: {
        id: "tab1",
        className: "vuuShell-Placeholder",
      },
      type: "Placeholder",
    },
  ],
};
