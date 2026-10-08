import {
  isNestedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import type { AppSwitcherMenuStyle, NavItem } from "./PortalAppSwitcher";

export const circleQuestionMarkIcon =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvcj0ic3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNpcmNsZS1xdWVzdGlvbi1tYXJrIHByZXZpZXctaWNvbiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJNOS4wOSA5YTMgMyAwIDAgMSA1LjgzIDFjMCAyLTMgMy0zIDMiLz48cGF0aCBkPSJNMTIgMTdoLjAxIi8+PC9zdmc+";

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

/** Module ids in display order, depth first. */
export const navItemModuleIds = (
  navItems: NavItem[],
): NonNullable<NavItem["moduleId"]>[] =>
  navItems.flatMap((navItem) => [
    ...(navItem.moduleId === undefined ? [] : [navItem.moduleId]),
    ...navItemModuleIds(navItem.children ?? []),
  ]);
