import { Button, Text } from "@salt-ds/core";
import { AddIcon, EditIcon, TreeIcon } from "@salt-ds/icons";
import cx from "clsx";
import type { KeyboardEvent } from "react";
import type { ModuleView } from "../data/module-model";
import { ModuleActionsMenu, useModuleActions } from "./ModuleActions";
import {
  ConnectionTag,
  EnabledStatus,
  FactList,
  HostStatus,
  IssueBanner,
  MenuLocation,
  NavIcon,
  RoleTag,
} from "./ui";

const classBase = "vuuModuleCard";

export const remoteName = (
  module: Pick<ModuleView, "mfScope" | "mfComponent">,
) =>
  module.mfScope || module.mfComponent
    ? `${module.mfScope}/${module.mfComponent.replace(/^\.\//, "")}`
    : "–";

export const ModuleCard = ({
  module,
  selected,
}: {
  module: ModuleView;
  selected?: boolean;
}) => {
  const actions = useModuleActions();
  const select = () => actions.select(module);
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      select();
    }
  };

  return (
    <article
      aria-label={module.title}
      className={cx(classBase, {
        [`${classBase}-disabled`]: !module.enabled,
        [`${classBase}-selected`]: selected,
      })}
      onClick={select}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <header className={`${classBase}-header`}>
        <NavIcon name={module.name} url={module.navIconUrl} />
        <div className={`${classBase}-titles`}>
          <h3 className={`${classBase}-title`}>{module.title}</h3>
          <code className={`${classBase}-name`}>
            {module.name} · v{module.version}
          </code>
        </div>
        <EnabledStatus enabled={module.enabled} />
      </header>
      {module.description ? (
        <Text className={`${classBase}-description`}>{module.description}</Text>
      ) : null}
      {module.issues.length > 0 ? (
        <div className={`${classBase}-issues`}>
          {module.issues.map((issue) => (
            <IssueBanner key={issue.kind}>{issue.message}</IssueBanner>
          ))}
        </div>
      ) : null}
      <FactList
        facts={[
          ["Menu", <MenuLocation key="menu" module={module} />],
          ["Route", <code key="route">{module.path || "–"}</code>],
          ["Remote", <code key="remote">{remoteName(module)}</code>],
          ["Host", <HostStatus key="host" module={module} />],
        ]}
      />
      <footer className={`${classBase}-footer`}>
        <div className={`${classBase}-tags`}>
          <RoleTag module={module} />
          <ConnectionTag module={module} />
        </div>
        <div className={`${classBase}-actions`}>
          <Button
            appearance="transparent"
            aria-label={`Edit ${module.title}`}
            onClick={(event) => {
              event.stopPropagation();
              actions.edit(module);
            }}
          >
            <EditIcon aria-hidden />
          </Button>
          <ModuleActionsMenu module={module} />
        </div>
      </footer>
      {module.children.length > 0 ? (
        <div className={`${classBase}-children`}>
          <TreeIcon aria-hidden />
          <Text color="secondary">
            Child {module.children.length === 1 ? "module" : "modules"}:
          </Text>
          <strong>
            {module.children.map(({ title }) => title).join(", ")}
          </strong>
        </div>
      ) : null}
    </article>
  );
};

export const NewModuleCard = ({ onClick }: { onClick: () => void }) => (
  <button className={`${classBase}-new`} onClick={onClick} type="button">
    <span className={`${classBase}-newIcon`}>
      <AddIcon aria-hidden />
    </span>
    <strong>New module</strong>
    <Text color="secondary">Register a remote with module discovery</Text>
  </button>
);
