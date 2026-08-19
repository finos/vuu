import {
  Avatar,
  type AvatarProps,
  Code,
  H2,
  Link,
  type LinkProps,
  StatusIndicator,
  Tag,
  Text,
} from "@salt-ds/core";
import { LockedIcon } from "@salt-ds/icons";
import cx from "clsx";
import { type ReactNode, useCallback } from "react";
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
  useNavigate,
} from "react-router-dom";
import type { PortalApplication } from "../../data/applications";
import { useApplications } from "../../data/useApplicationModel";

import "./AdminUi.css";

const classBase = "vuuAdminUi";

/**
 * Salt categories used, in order, to colour applications. Each application
 * keeps its colour on every page, which ties its groups, roles and users back
 * to it.
 */
const APPLICATION_CATEGORIES = [1, 5, 9, 13, 17, 3, 7, 11, 15, 19] as const;

export const plural = (count: number, noun: string) =>
  `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

export const categoryFor = (
  applications: readonly Pick<PortalApplication, "name">[],
  name: string | undefined,
) => {
  const index = applications.findIndex(
    (application) => application.name === name,
  );
  return index === -1
    ? undefined
    : APPLICATION_CATEGORIES[index % APPLICATION_CATEGORIES.length];
};

/** Salt category (1-20) for an application name. */
export const useApplicationCategory = (name: string | undefined) => {
  const { applications } = useApplications();
  return categoryFor(applications, name);
};

export interface AppAvatarProps extends Omit<AvatarProps, "color" | "name"> {
  application?: Pick<PortalApplication, "name" | "title">;
}

export const AppAvatar = ({
  application,
  className,
  ...props
}: AppAvatarProps) => {
  const category = useApplicationCategory(application?.name);
  return (
    <Avatar
      {...props}
      aria-hidden
      className={cx(`${classBase}-avatar`, className)}
      color={category ? `category-${category}` : undefined}
      name={application?.title}
    />
  );
};

export const AppTag = ({
  application,
}: {
  application: Pick<PortalApplication, "name" | "title">;
}) => {
  const category = useApplicationCategory(application.name);
  return <Tag category={category}>{application.title}</Tag>;
};

/** A Salt link to another admin page, resolved relative to the current page. */
export const AdminLink = ({
  to,
  ...props
}: Omit<LinkProps, "href" | "render"> & { to: string }) => (
  <Link {...props} render={<RouterLink relative="path" to={to} />} />
);

export interface AdminButtonLinkProps
  extends Omit<RouterLinkProps, "relative"> {
  sentiment?: "accented" | "neutral";
}

/**
 * A navigation link to another admin page that looks like a Salt button.
 * Navigation keeps link semantics (href, open in new tab).
 */
export const AdminButtonLink = ({
  className,
  sentiment = "neutral",
  ...props
}: AdminButtonLinkProps) => (
  <RouterLink
    {...props}
    className={cx(
      `${classBase}-buttonLink`,
      `${classBase}-buttonLink-${sentiment}`,
      className,
    )}
    relative="path"
  />
);

/** Navigates to another admin page, e.g. `../groups?create=true`. */
export const useAdminNavigate = () => {
  const navigate = useNavigate();
  return useCallback(
    (to: string) => navigate(to, { relative: "path" }),
    [navigate],
  );
};

/** Marks the portal access role, which every application group includes. */
export const AccessTag = ({
  children = "Access",
}: {
  children?: ReactNode;
}) => (
  <Tag bordered className={`${classBase}-accessTag`} title="Portal access role">
    <LockedIcon aria-hidden />
    {children}
  </Tag>
);

/** A group name with its application prefix de-emphasised. */
export const GroupName = ({
  name,
  prefix,
}: {
  name: string;
  prefix?: string;
}) =>
  prefix && name.startsWith(prefix) ? (
    <span className={`${classBase}-groupName`}>
      <span className={`${classBase}-groupPrefix`}>{prefix}</span>
      <strong>{name.slice(prefix.length)}</strong>
    </span>
  ) : (
    <strong className={`${classBase}-groupName`}>{name}</strong>
  );

export const RoleName = ({ children }: { children: ReactNode }) => (
  <Code className={`${classBase}-roleName`}>{children}</Code>
);

export const StatusText = ({
  children,
  status,
}: {
  children: ReactNode;
  status: "success" | "warning" | "error" | "info";
}) => (
  <span className={`${classBase}-status`}>
    <StatusIndicator status={status} />
    {children}
  </span>
);

export const PageHeader = ({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description?: ReactNode;
  title: string;
}) => (
  <header className={`${classBase}-pageHeader`}>
    <div className={`${classBase}-stack`}>
      <H2>{title}</H2>
      {description ? <Text color="secondary">{description}</Text> : null}
    </div>
    {actions ? <div className={`${classBase}-actions`}>{actions}</div> : null}
  </header>
);

/** The heading of a side panel: avatar, title, subtitle and optional tags. */
export const PanelHeading = ({
  avatar,
  subtitle,
  tags,
  title,
}: {
  avatar: ReactNode;
  subtitle?: ReactNode;
  tags?: ReactNode;
  title: ReactNode;
}) => (
  <div className={`${classBase}-panelHeading`}>
    {avatar}
    <div className={`${classBase}-stack`}>
      <span className={`${classBase}-panelTitle`}>{title}</span>
      {subtitle ? (
        <Text color="secondary" styleAs="label">
          {subtitle}
        </Text>
      ) : null}
      {tags ? <div className={`${classBase}-tags`}>{tags}</div> : null}
    </div>
  </div>
);

export const Metric = ({
  label,
  value,
}: {
  label: ReactNode;
  value: ReactNode;
}) => (
  <div className={`${classBase}-metric`}>
    <span className={`${classBase}-metricValue`}>{value}</span>
    <Text color="secondary" styleAs="label">
      {label}
    </Text>
  </div>
);

/** A square tile holding an icon, used by KPI and fact cards. */
export const IconTile = ({
  children,
  size = "medium",
}: {
  children: ReactNode;
  size?: "medium" | "large";
}) => (
  <span
    className={cx(`${classBase}-iconTile`, `${classBase}-iconTile-${size}`)}
  >
    {children}
  </span>
);

/** One row of a role list, e.g. in a group or on an application. */
export const RoleRow = ({
  description,
  end,
  icon,
  name,
}: {
  description?: ReactNode;
  end?: ReactNode;
  icon?: ReactNode;
  name: ReactNode;
}) => (
  <li className={`${classBase}-roleRow`}>
    {icon ? <span className={`${classBase}-roleRowIcon`}>{icon}</span> : null}
    <span className={`${classBase}-stack`}>
      <RoleName>{name}</RoleName>
      {description ? (
        <Text color="secondary" styleAs="label">
          {description}
        </Text>
      ) : null}
    </span>
    {end}
  </li>
);

export const RoleList = ({
  "aria-label": ariaLabel,
  children,
}: {
  "aria-label": string;
  children: ReactNode;
}) => (
  <ul aria-label={ariaLabel} className={`${classBase}-roleList`}>
    {children}
  </ul>
);
