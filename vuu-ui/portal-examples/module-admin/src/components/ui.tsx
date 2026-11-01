import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import type { ModuleView } from "../data/module-model";
import { splitLocation } from "../data/module-model";

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
  size?: "small" | "medium";
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

export type StatusTone = "positive" | "neutral" | "warning" | "negative";

/** A small coloured label, e.g. Enabled or 2 issues. */
export const StatusPill = ({
  children,
  icon,
  tone,
}: {
  children: ReactNode;
  icon?: string;
  tone: StatusTone;
}) => (
  <span className={cx(`${classBase}-pill`, `${classBase}-pill-${tone}`)}>
    {icon ? <Icon name={icon} /> : null}
    {children}
  </span>
);

/** A dot showing whether a module is enabled or needs attention. */
export const StatusDot = ({ module }: { module: ModuleView }) => {
  const issues = module.issues.length;
  const label =
    issues > 0
      ? `${issues} issue${issues > 1 ? "s" : ""}`
      : module.enabled
        ? "Enabled"
        : "Disabled";
  return (
    <span
      aria-label={label}
      className={cx(`${classBase}-dot`, {
        [`${classBase}-dot-disabled`]: !module.enabled && issues === 0,
        [`${classBase}-dot-warning`]: issues > 0,
      })}
      role="img"
      title={label}
    />
  );
};

export const MenuLocation = ({ module }: { module: ModuleView }) => {
  if (module.parent) {
    return (
      <span className={`${classBase}-muted`}>
        None, opened from {module.parent.title}
      </span>
    );
  }
  if (!module.location) return <span className={`${classBase}-muted`}>–</span>;
  const [section, label] = splitLocation(module.location);
  return (
    <span className={`${classBase}-menuLocation`}>
      {section}
      <Icon className={`${classBase}-chevron`} name="chevron-right" />
      {label}
    </span>
  );
};

export const RoleTag = ({
  className,
  role,
}: {
  className?: string;
  role: string;
}) => (
  <code className={cx(`${classBase}-role`, className)}>
    <Icon name="module-lock" />
    {role}
  </code>
);

/** The file a value comes from: modules.yaml or the remote's config.json. */
export const SourceTag = ({ file }: { file: string }) => (
  <code className={`${classBase}-sourceTag`}>{file}</code>
);

export type Fact = [label: string, value: ReactNode];

/** A label/value list. */
export const FactList = ({ facts }: { facts: Fact[] }) => (
  <dl className={`${classBase}-facts`}>
    {facts.map(([label, value]) => (
      <div className={`${classBase}-fact`} key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
);

export const Section = ({
  children,
  icon,
  note,
  title,
}: {
  children: ReactNode;
  icon: string;
  note?: ReactNode;
  title: string;
}) => (
  <section aria-label={title} className={`${classBase}-section`}>
    <h3 className={`${classBase}-sectionHeading`}>
      <Icon name={icon} />
      {title}
      {note ? <span className={`${classBase}-sectionNote`}>{note}</span> : null}
    </h3>
    {children}
  </section>
);

/** A centred message for an empty list or pane. */
export const EmptyMessage = ({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  title: string;
}) => (
  <div className={`${classBase}-empty`}>
    <strong>{title}</strong>
    {children ? <span>{children}</span> : null}
    {action}
  </div>
);
