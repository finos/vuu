import { Text } from "@salt-ds/core";
import type { ModuleGroup } from "../data/module-model";
import { plural } from "../data/module-model";
import { ModuleCard, NewModuleCard } from "./ModuleCard";

const classBase = "vuuModuleAdmin";

export const ModuleGrid = ({
  groups,
  onCreate,
}: {
  groups: ModuleGroup[];
  onCreate: () => void;
}) => (
  <div className={`${classBase}-groups`}>
    {groups.map((group, index) => (
      <section
        aria-label={group.label || "Modules"}
        className={`${classBase}-group`}
        key={group.key}
      >
        {group.label ? (
          <h2 className={`${classBase}-groupHeading`}>
            {group.label}
            <Text color="secondary" styleAs="label">
              {plural(group.modules.length, "module")}
            </Text>
          </h2>
        ) : null}
        <div className={`${classBase}-grid`}>
          {group.modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
          {index === groups.length - 1 ? (
            <NewModuleCard onClick={onCreate} />
          ) : null}
        </div>
      </section>
    ))}
  </div>
);
