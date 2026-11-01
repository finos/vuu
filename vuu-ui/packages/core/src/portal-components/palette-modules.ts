import type { VuuModuleWorkspaceDescriptor } from "@vuu-ui/vuu-protocol-types";
import { useMemo } from "react";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import {
  portalModuleTemplate,
  useRegisteredModules,
} from "./portal-module-component";
import type { TypedComponentTemplate } from "@vuu-ui/grid-layout";

export interface PaletteModule {
  /** `workspace.defaultSize` of the module, if any. */
  readonly defaultSize?: VuuModuleWorkspaceDescriptor["defaultSize"];
  readonly descriptor: RemoteModuleDescriptor;
  /** `workspace.iconUrl`, falling back to the module's `navIconUrl`. */
  readonly iconUrl?: string;
  readonly label: string;
  /** The template to drag, or add, to a workspace. */
  readonly template: TypedComponentTemplate;
}

export interface PaletteModuleGroup {
  readonly modules: readonly PaletteModule[];
  readonly paletteGroup: string;
}

/**
 * The modules that can be added to a workspace, grouped by
 * `workspace.paletteGroup` in order of first appearance. Only enabled
 * modules with a `workspace` descriptor are included.
 */
export const getPaletteModules = (
  modules: readonly RemoteModuleDescriptor[],
): PaletteModuleGroup[] => {
  const groups = new Map<string, PaletteModule[]>();
  for (const descriptor of modules) {
    const { enabled, navIconUrl, title, workspace } = descriptor;
    if (enabled === false || !workspace?.paletteGroup) {
      continue;
    }
    const iconUrl = workspace.iconUrl ?? navIconUrl;
    const paletteModule: PaletteModule = {
      ...(workspace.defaultSize ? { defaultSize: workspace.defaultSize } : {}),
      descriptor,
      ...(iconUrl ? { iconUrl } : {}),
      label: title,
      template: portalModuleTemplate(descriptor),
    };
    const group = groups.get(workspace.paletteGroup);
    if (group) {
      group.push(paletteModule);
    } else {
      groups.set(workspace.paletteGroup, [paletteModule]);
    }
  }
  return Array.from(groups, ([paletteGroup, groupModules]) => ({
    modules: groupModules,
    paletteGroup,
  }));
};

/** `getPaletteModules` for the modules of the portal module registry. */
export const usePaletteModules = () => {
  const modules = useRegisteredModules();
  return useMemo(() => getPaletteModules(modules), [modules]);
};
