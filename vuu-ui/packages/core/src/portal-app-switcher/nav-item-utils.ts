import {
  isNestedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import type { AppSwitcherMenuStyle, NavItem } from "./PortalAppSwitcher";

const toNavigationPath = (path: string) => path.replace(/\/\*$/, "");

export const buildNavItems = (
  registeredModules: RemoteModuleDescriptor[],
  menuStyle: AppSwitcherMenuStyle = "two-level",
): NavItem[] => {
  const remoteModules = registeredModules.filter(
    (remoteModule) => !isNestedModule(remoteModule),
  );
  if (menuStyle === "single-level") {
    return remoteModules.flatMap(
      ({ id, navLocation, navIconName, navIconUrl, path }) => {
        const title = navLocation.split("/").filter(Boolean).join(": ");
        return title
          ? [
              {
                href: toNavigationPath(path),
                moduleId: id,
                navIconName,
                navIconUrl,
                title,
              },
            ]
          : [];
      },
    );
  }

  const navItemsByPath = new Map<string, NavItem>();

  for (const {
    id,
    navLocation,
    navIconName,
    navIconUrl,
    path,
  } of remoteModules) {
    const pathSegments = navLocation.split("/").filter(Boolean);
    const [parentTitle, childTitle] = pathSegments;

    if (parentTitle === undefined) {
      continue;
    }

    const parentPath = `/${parentTitle}`;
    let parent = navItemsByPath.get(parentPath);

    if (parent === undefined) {
      parent = {
        href: childTitle === undefined ? toNavigationPath(path) : parentPath,
        moduleId: childTitle === undefined ? id : undefined,
        navIconName,
        navIconUrl,
        title: parentTitle,
      };
      navItemsByPath.set(parentPath, parent);
    }

    if (
      childTitle !== undefined &&
      !parent.children?.some(({ href }) => href === toNavigationPath(path))
    ) {
      parent.children = [
        ...(parent.children ?? []),
        {
          href: toNavigationPath(path),
          moduleId: id,
          title: childTitle,
        },
      ];
    }
  }

  return [...navItemsByPath.values()];
};
