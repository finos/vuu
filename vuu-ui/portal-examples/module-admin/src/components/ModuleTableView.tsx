import cx from "clsx";
import type { ModuleGroup } from "../data/module-model";
import { relativeTime } from "../data/module-model";
import { ModuleActionsMenu, useModuleActions } from "./ModuleActions";
import { remoteName } from "./ModuleCard";
import {
  EnabledStatus,
  HostStatus,
  MenuLocation,
  NavIcon,
  RoleTag,
} from "./ui";

const classBase = "vuuModuleTable";

export const ModuleTableView = ({
  groups,
  selectedId,
}: {
  groups: ModuleGroup[];
  selectedId?: number;
}) => {
  const actions = useModuleActions();
  return (
    <table className={classBase}>
      <thead>
        <tr>
          <th>Module</th>
          <th>Menu</th>
          <th>Route</th>
          <th>Remote</th>
          <th>Host</th>
          <th>Access</th>
          <th>Status</th>
          <th>Updated</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.key}>
          {group.label ? (
            <tr className={`${classBase}-group`}>
              <th colSpan={9}>{group.label}</th>
            </tr>
          ) : null}
          {group.modules.map((module) => (
            <tr
              aria-selected={module.id === selectedId}
              className={cx({
                [`${classBase}-disabled`]: !module.enabled,
                [`${classBase}-selected`]: module.id === selectedId,
              })}
              key={module.id}
              onClick={() => actions.select(module)}
            >
              <td>
                <span className={`${classBase}-module`}>
                  <NavIcon
                    name={module.name}
                    size="small"
                    url={module.navIconUrl}
                  />
                  <span>
                    <strong>{module.title}</strong>
                    <code>{module.name}</code>
                  </span>
                </span>
              </td>
              <td>
                <MenuLocation module={module} />
              </td>
              <td>
                <code>{module.path || "–"}</code>
              </td>
              <td>
                <code>{remoteName(module)}</code>
              </td>
              <td>
                <HostStatus module={module} />
              </td>
              <td>
                <RoleTag module={module} />
              </td>
              <td>
                <EnabledStatus enabled={module.enabled} />
              </td>
              <td>{relativeTime(module.updated)}</td>
              <td>
                <ModuleActionsMenu module={module} />
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
};
