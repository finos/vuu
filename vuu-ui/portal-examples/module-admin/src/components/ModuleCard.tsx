import { Text } from "@salt-ds/core";
import { AddIcon, ChevronRightIcon, MenuIcon, TreeIcon } from "@salt-ds/icons";
import cx from "clsx";
import type { KeyboardEvent } from "react";
import { type ModuleView, issueSummary } from "../data/module-model";
import { useModuleActions } from "./ModuleActions";
import {
  EnabledStatus,
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

export const ModuleCard = ({ module }: { module: ModuleView }) => {
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
  const issues = issueSummary(module);

  return (
    <article
      aria-label={module.title}
      className={cx(classBase, {
        [`${classBase}-disabled`]: !module.enabled,
      })}
      onClick={select}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div className={`${classBase}-body`}>
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
          <Text className={`${classBase}-description`}>
            {module.description}
          </Text>
        ) : null}
        <div className={`${classBase}-menu`}>
          {module.parent ? <TreeIcon aria-hidden /> : <MenuIcon aria-hidden />}
          <MenuLocation module={module} />
        </div>
        {issues ? <IssueBanner>{issues}</IssueBanner> : null}
      </div>
      <footer className={`${classBase}-footer`}>
        <RoleTag module={module} />
        <span className={`${classBase}-open`}>
          Open <ChevronRightIcon aria-hidden />
        </span>
      </footer>
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
