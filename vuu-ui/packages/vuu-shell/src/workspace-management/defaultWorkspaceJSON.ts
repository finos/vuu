import { StackProps } from "@finos/vuu-layout";
import { LayoutJSON, VuuShellLocation } from "@finos/vuu-utils";

export type WorkspaceStackProps = Pick<
  StackProps,
  "showTabs" | "TabstripProps"
>;

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

export const loadingJSON: Readonly<LayoutJSON> = {
  type: "Component",
  id: "loading-main",
  props: {},
};

export const getStackWorkspaceJSON = (
  activeLayoutIndex?: number
): LayoutJSON<
  StackProps & {
    preserve: boolean;
  }
> => {
  return {
    type: "Stack",
    id: VuuShellLocation.Workspace,
    props: {
      className: `${VuuShellLocation.Workspace}-tabs`,
      TabstripProps: {
        allowAddTab: true,
        allowCloseTab: true,
        allowRenameTab: true,
        animateSelectionThumb: false,
        "aria-label": "Workspace Tabs",
        location: "workspace-tab",
        variant: "primary",
      },
      preserve: true,
      active: activeLayoutIndex ?? 0,
    },
  };
};

const placeholderLayout: LayoutJSON = {
  props: {
    id: "tab1",
    title: "Tab 1",
    className: "vuuShell-Placeholder",
  },
  type: "Placeholder",
};

export const getWorkspaceWithLayoutJSON = (
  customWorkspaceJSON?: LayoutJSON,
  layoutJSON: LayoutJSON | LayoutJSON[] = placeholderLayout,
  activeLayoutIndex?: number,
  stackProps?: WorkspaceStackProps
): LayoutJSON => {
  if (customWorkspaceJSON) {
    return {
      ...customWorkspaceJSON,
      children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
    };
  } else {
    return {
      ...getStackWorkspaceJSON(activeLayoutIndex),
      props: {
        ...getStackWorkspaceJSON(activeLayoutIndex).props,
        ...stackProps,
        TabstripProps: {
          ...getStackWorkspaceJSON(activeLayoutIndex).props?.TabstripProps,
          ...stackProps?.TabstripProps,
        },
      },
      children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
    };
  }
};
