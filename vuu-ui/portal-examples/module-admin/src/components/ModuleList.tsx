import { PortalLink } from "@vuu-ui/core/portal";
import cx from "clsx";
import type { ModuleGroup } from "../data/module-model";
import { useModuleAdmin } from "../ModuleAdminContext";
import { NavIcon, StatusDot } from "./ui";

const classBase = "vuuModuleList";

/** Modules grouped by menu section. Child modules follow their parent. */
export const ModuleList = ({
  groups,
  selectedName,
}: {
  groups: ModuleGroup[];
  selectedName?: string;
}) => {
  const { paths } = useModuleAdmin();
  return (
    <nav aria-label="Modules" className={classBase}>
      {groups.map(({ modules, section }) => (
        <section aria-label={section || "Not in menu"} key={section}>
          <h3 className={`${classBase}-group`}>
            {section || "Not in menu"}
            <span className="vuuModuleAdmin-count">{modules.length}</span>
          </h3>
          <ul>
            {modules.map((module) => (
              <li key={module.id}>
                <PortalLink
                  aria-current={
                    module.name === selectedName ? "page" : undefined
                  }
                  className={cx(`${classBase}-row`, {
                    [`${classBase}-row-child`]: module.parent,
                    [`${classBase}-row-disabled`]: !module.enabled,
                    [`${classBase}-row-selected`]: module.name === selectedName,
                  })}
                  to={paths.module(module.name)}
                >
                  <NavIcon
                    name={module.name}
                    size="small"
                    url={module.navIconUrl}
                  />
                  <span className={`${classBase}-title`}>
                    {module.title}
                    {module.parent ? null : <code>{module.name}</code>}
                  </span>
                  <code className={`${classBase}-route`}>
                    {module.path || "nested"}
                  </code>
                  <StatusDot module={module} />
                </PortalLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
};
