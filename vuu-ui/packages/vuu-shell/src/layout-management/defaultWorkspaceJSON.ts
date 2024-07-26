import { LayoutJSON, VuuShellLocation } from "@finos/vuu-utils";
import { WorkspaceProps } from "./LayoutManagementProvider";
import { StackProps } from "packages/vuu-layout/src";

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

export const stackWorkspaceJSON: LayoutJSON<
  StackProps & {
    preserve: boolean;
  }
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
      location: "workspace-tab",
      variant: "primary",
    },
    preserve: true,
    active: 0,
  },
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
  stackProps?: WorkspaceProps
): LayoutJSON => {
  if (customWorkspaceJSON) {
    return {
      ...customWorkspaceJSON,
      children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
    };
  } else {
    return {
      ...stackWorkspaceJSON,
      props: {
        ...stackWorkspaceJSON.props,
        ...stackProps,
        TabstripProps: {
          ...stackWorkspaceJSON.props?.TabstripProps,
          ...stackProps?.TabstripProps,
        },
      },
      children: Array.isArray(layoutJSON) ? layoutJSON : [layoutJSON],
    };
  }
};
