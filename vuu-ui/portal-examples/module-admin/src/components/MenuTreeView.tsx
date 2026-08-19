import { Text } from "@salt-ds/core";
import { InfoIcon } from "@salt-ds/icons";
import cx from "clsx";
import type { ModuleView } from "../data/module-model";
import { sortModules, splitLocation } from "../data/module-model";
import { ModuleActionsMenu, useModuleActions } from "./ModuleActions";
import { EnabledStatus, NavIcon, RoleTag } from "./ui";

const classBase = "vuuModuleTree";

interface Section {
  name: string;
  modules: ModuleView[];
}

/** Top level modules by menu section, in portal menu order. */
export const menuTree = (modules: readonly ModuleView[]): Section[] => {
  const sections = new Map<string, Section>();
  for (const module of sortModules(modules, "menu")) {
    if (module.parent) continue;
    const name = splitLocation(module.location)[0] || "Not in menu";
    const section = sections.get(name) ?? { modules: [], name };
    section.modules.push(module);
    sections.set(name, section);
  }
  return [...sections.values()];
};

const TreeRow = ({
  child,
  module,
  selected,
}: {
  child?: boolean;
  module: ModuleView;
  selected: boolean;
}) => {
  const actions = useModuleActions();
  return (
    <li
      aria-selected={selected}
      className={cx(`${classBase}-row`, {
        [`${classBase}-row-child`]: child,
        [`${classBase}-row-disabled`]: !module.enabled,
        [`${classBase}-row-selected`]: selected,
      })}
      role="treeitem"
    >
      <button
        className={`${classBase}-select`}
        onClick={() => actions.select(module)}
        type="button"
      >
        <NavIcon name={module.name} size="small" url={module.navIconUrl} />
        <span className={`${classBase}-label`}>
          {child
            ? module.title
            : splitLocation(module.location)[1] || module.title}
        </span>
        <code className={`${classBase}-path`}>{module.path || "–"}</code>
      </button>
      <RoleTag module={module} />
      <EnabledStatus enabled={module.enabled} />
      <ModuleActionsMenu module={module} />
    </li>
  );
};

const MenuPreview = ({ sections }: { sections: Section[] }) => (
  <aside aria-label="Portal menu preview" className={`${classBase}-preview`}>
    <Text color="secondary" styleAs="label">
      Portal menu preview
    </Text>
    <nav className={`${classBase}-previewMenu`}>
      {sections
        .filter(({ name }) => name !== "Not in menu")
        .map((section) => {
          const visible = section.modules.filter(({ enabled }) => enabled);
          return visible.length > 0 ? (
            <div key={section.name}>
              <div className={`${classBase}-previewSection`}>
                {section.name}
              </div>
              {visible.map((module) => (
                <div className={`${classBase}-previewItem`} key={module.id}>
                  <NavIcon
                    name={module.name}
                    size="small"
                    url={module.navIconUrl}
                  />
                  {splitLocation(module.location)[1]}
                </div>
              ))}
            </div>
          ) : null;
        })}
    </nav>
    <Text
      className={`${classBase}-previewNote`}
      color="secondary"
      styleAs="label"
    >
      Disabled modules are hidden. Users only see modules their roles allow.
    </Text>
  </aside>
);

export const MenuTreeView = ({
  modules,
  selectedId,
}: {
  modules: readonly ModuleView[];
  selectedId?: number;
}) => {
  const sections = menuTree(modules);
  const childrenOf = (module: ModuleView) =>
    sortModules(
      modules.filter(({ parentModuleId }) => parentModuleId === module.id),
      "title",
    );
  return (
    <div className={classBase}>
      <div className={`${classBase}-main`}>
        <Text className={`${classBase}-note`} color="secondary">
          <InfoIcon aria-hidden /> Menu order follows section and label. Child
          modules open from their parent and are not shown in the menu.
        </Text>
        <ul
          aria-label="Menu structure"
          className={`${classBase}-sections`}
          role="tree"
        >
          {sections.map((section) => (
            <li
              className={`${classBase}-section`}
              key={section.name}
              role="none"
            >
              <div className={`${classBase}-sectionName`}>{section.name}</div>
              <ul role="group">
                {section.modules.flatMap((module) => [
                  <TreeRow
                    key={module.id}
                    module={module}
                    selected={module.id === selectedId}
                  />,
                  ...childrenOf(module).map((child) => (
                    <TreeRow
                      child
                      key={child.id}
                      module={child}
                      selected={child.id === selectedId}
                    />
                  )),
                ])}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <MenuPreview sections={sections} />
    </div>
  );
};
