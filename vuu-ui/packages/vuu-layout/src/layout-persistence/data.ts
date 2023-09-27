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
      allowRenameTab: true,
      animateSelectionThumb: false,
      location: "main-tab",
    },
    preserve: true,
    active: 0,
  },
  children: [
    {
      type: "Stack",
      props: {
        active: 0,
        title: "My Instruments",
        TabstripProps: {
          allowRenameTab: true,
          allowCloseTab: true,
        },
      },
      children: [
        {
          type: "View",
          props: {
            title: "European Stock",
          },
          style: { height: "calc(100% - 6px)" },
          children: [
            {
              type: "FilterTable",
            },
          ],
        },
        {
          type: "View",
          props: {
            title: "Other Stock",
          },
          style: { height: "calc(100% - 6px)" },
          children: [
            {
              type: "FilterTable",
            },
          ],
        },
      ],
    },
  ],
}