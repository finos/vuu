import { StackProps } from "@vuu-ui/vuu-layout";
import { LayoutJSON, VuuShellLocation } from "@vuu-ui/vuu-utils";

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

export const defaultWorkspaceJSON: LayoutJSON<
  StackProps & { preserve: boolean }
> = {
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
  },
};

export const getStackWorkspaceJSON = (
  activeLayoutIndex?: number,
): LayoutJSON => ({
  ...defaultWorkspaceJSON,
  active: activeLayoutIndex ?? 0,
});

const placeholderLayout: LayoutJSON = {
  props: {
    id: "tab1",
    title: "Tab 1",
    className: "vuuShell-Placeholder",
  },
  type: "Placeholder",
};

export const getWorkspaceWithLayoutJSON = (
  customWorkspaceJSON?: LayoutJSON | LayoutJSON[],
  layoutJSON: LayoutJSON | LayoutJSON[] = placeholderLayout,
  activeLayoutIndex?: number,
  stackProps?: WorkspaceStackProps,
): LayoutJSON | LayoutJSON[] => {
  const stackWorkspace = getStackWorkspaceJSON(activeLayoutIndex);
  if (Array.isArray(customWorkspaceJSON)) {
    const workspace = customWorkspaceJSON.find(
      (layout) => layout.id === VuuShellLocation.Workspace,
    );
    if (workspace) {
      return customWorkspaceJSON.map((ws) => {
        if (ws.id === VuuShellLocation.Workspace) {
          return {
            ...ws,
            children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
          };
        } else {
          return ws;
        }
      });
    } else {
      throw Error(
        "Multiple workspaces have been provided but none has the workspace id",
      );
    }
  } else if (customWorkspaceJSON) {
    return {
      ...customWorkspaceJSON,
      children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
    };
  } else {
    return {
      ...stackWorkspace,
      props: {
        ...stackWorkspace.props,
        ...stackProps,
        TabstripProps: {
          ...stackWorkspace.props?.TabstripProps,
          ...stackProps?.TabstripProps,
        },
      },
      children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
    };
  }
};
