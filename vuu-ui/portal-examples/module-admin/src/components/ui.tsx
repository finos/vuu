import { StatusIndicator, Tag, Text } from "@salt-ds/core";
import { LinkedIcon, LockedIcon, WarningIcon } from "@salt-ds/icons";
import cx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import type { ModuleView } from "../data/module-model";
import { hostOf, splitLocation } from "../data/module-model";

const classBase = "vuuModuleAdmin";

/** Salt categories used to colour module icons. */
const CATEGORIES = [1, 9, 3, 4, 13, 6, 10, 11, 15, 19] as const;

export const categoryFor = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CATEGORIES[hash % CATEGORIES.length];
};

/** The module's navigation icon, tinted with the module's category colour. */
export const NavIcon = ({
  className,
  name,
  size = "medium",
  url,
}: {
  className?: string;
  name: string;
  size?: "small" | "medium" | "large";
  url: string;
}) => {
  const category = categoryFor(name);
  const style = {
    "--module-category-bg": `var(--salt-palette-categorical-${category}-weakest, var(--salt-container-secondary-background))`,
    "--module-category-fg": `var(--salt-palette-categorical-${category}, var(--salt-content-secondary-foreground))`,
    "--module-icon": url ? `url("${url}")` : undefined,
  } as CSSProperties;
  return (
    <span
      aria-hidden
      className={cx(
        `${classBase}-navIcon`,
        `${classBase}-navIcon-${size}`,
        className,
      )}
      style={style}
    >
      {url ? (
        <span className={`${classBase}-navIconGlyph`} />
      ) : (
        <span className={`${classBase}-navIconLetter`}>
          {(name[0] ?? "?").toUpperCase()}
        </span>
      )}
    </span>
  );
};

export const EnabledStatus = ({ enabled }: { enabled: boolean }) => (
  <span
    className={cx(`${classBase}-status`, {
      [`${classBase}-status-disabled`]: !enabled,
    })}
  >
    <StatusIndicator status={enabled ? "success" : "info"} />
    {enabled ? "Enabled" : "Disabled"}
  </span>
);

export const MenuLocation = ({ module }: { module: ModuleView }) => {
  if (module.parent) {
    return (
      <span className={`${classBase}-menuLocation`}>
        <Text color="secondary">Opened from</Text>
        <strong>{module.parent.title}</strong>
      </span>
    );
  }
  if (!module.location) return <span>–</span>;
  const [section, label] = splitLocation(module.location);
  return (
    <span className={`${classBase}-menuLocation`}>
      {section}
      <span aria-hidden className={`${classBase}-chevron`}>
        ›
      </span>
      {label}
    </span>
  );
};

export const RoleTag = ({ module }: { module: ModuleView }) =>
  module.effectiveAccessRole ? (
    <Tag bordered className={`${classBase}-tag`} title="Access role">
      <LockedIcon aria-hidden />
      {module.accessRoleInherited
        ? `Inherits ${module.effectiveAccessRole}`
        : module.effectiveAccessRole}
    </Tag>
  ) : (
    <Tag
      bordered
      className={cx(`${classBase}-tag`, `${classBase}-tag-warning`)}
      title="No access role"
    >
      <LockedIcon aria-hidden />
      No access role
    </Tag>
  );

export const ConnectionTag = ({ module }: { module: ModuleView }) =>
  module.vuuConnectionId ? (
    <Tag
      bordered
      className={`${classBase}-tag`}
      title={`Dedicated Vuu connection ${module.vuuWebsocketUrl}`}
    >
      <LinkedIcon aria-hidden />
      {module.vuuConnectionId}
    </Tag>
  ) : null;

export const HostStatus = ({ module }: { module: ModuleView }) => {
  const status = module.remote?.status;
  return (
    <span className={`${classBase}-host`} title={module.remote?.summary}>
      <StatusIndicator
        status={
          status === "ok"
            ? "success"
            : status === "unreachable"
              ? "error"
              : status === "mismatch"
                ? "warning"
                : "info"
        }
      />
      <code>{hostOf(module.mfUrl) || "–"}</code>
    </span>
  );
};

export const IssueBanner = ({ children }: { children: ReactNode }) => (
  <div className={`${classBase}-issue`} role="note">
    <WarningIcon aria-hidden />
    <span>{children}</span>
  </div>
);

/** A label/value list, as used on cards and in the details panel. */
export const FactList = ({
  facts,
  variant = "card",
}: {
  facts: [label: string, value: ReactNode][];
  variant?: "card" | "panel";
}) => (
  <dl className={cx(`${classBase}-facts`, `${classBase}-facts-${variant}`)}>
    {facts.map(([label, value]) => (
      <div className={`${classBase}-fact`} key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
);

export const SectionHeading = ({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) => (
  <h3 className={`${classBase}-sectionHeading`}>
    {icon}
    {children}
  </h3>
);
