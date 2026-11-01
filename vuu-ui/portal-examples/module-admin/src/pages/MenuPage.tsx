import { PortalLink } from "@vuu-ui/core/portal";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { Fragment, useMemo } from "react";
import { EmptyMessage, NavIcon, StatusDot } from "../components/ui";
import { listModules, splitLocation } from "../data/module-model";
import { useModuleAdmin } from "../ModuleAdminContext";

const classBase = "vuuMenuPage";

/**
 * The portal navigation built from the modules: each menu section, its
 * entries and the nested modules each entry opens. The table scrolls; its
 * column headers stick.
 */
export const MenuPage = () => {
  const { filter, paths, status, views } = useModuleAdmin();
  const groups = useMemo(
    () => listModules(views, filter, status),
    [filter, status, views],
  );

  if (groups.length === 0) {
    return (
      <div className={classBase}>
        <EmptyMessage title="No menu entries match the filter" />
      </div>
    );
  }

  return (
    <div className={classBase}>
      <table className={`${classBase}-table`}>
        <thead>
          <tr>
            <th scope="col">Menu entry</th>
            <th scope="col">Route</th>
            <th scope="col">Module</th>
            <th scope="col">Access role</th>
            <th scope="col">
              <span className="vuuModuleAdmin-visuallyHidden">Status</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map(({ modules, section }) => {
            const entries = modules.filter(({ parent }) => !parent).length;
            return (
              <Fragment key={section}>
                <tr className={`${classBase}-section`}>
                  <th colSpan={4} scope="rowgroup">
                    {section || "Not in menu"}
                  </th>
                  <td className={`${classBase}-dim`}>
                    {entries} entr{entries === 1 ? "y" : "ies"}
                  </td>
                </tr>
                {modules.map((module) => (
                  <tr
                    className={cx({
                      [`${classBase}-nested`]: module.parent,
                      [`${classBase}-disabled`]: !module.enabled,
                    })}
                    key={module.id}
                  >
                    <th scope="row">
                      <PortalLink
                        className={`${classBase}-entry`}
                        to={paths.module(module.name)}
                      >
                        {module.parent ? (
                          <Icon name="module-nested" />
                        ) : (
                          <NavIcon
                            name={module.name}
                            size="small"
                            url={module.navIconUrl}
                          />
                        )}
                        {module.parent
                          ? module.title
                          : splitLocation(module.location)[1] || module.title}
                        {module.parent ? (
                          <span className={`${classBase}-dim`}>nested</span>
                        ) : null}
                      </PortalLink>
                    </th>
                    <td>
                      <code>{module.path || "–"}</code>
                    </td>
                    <td>
                      <code>{module.name}</code>
                    </td>
                    <td>
                      <code>{module.effectiveAccessRole || "–"}</code>
                      {module.accessRoleInherited ? (
                        <span className={`${classBase}-dim`}> inherited</span>
                      ) : null}
                    </td>
                    <td>
                      <StatusDot module={module} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
