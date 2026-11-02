import { Card, Code, Divider, H3, Text } from "@salt-ds/core";
import { ChevronRightIcon, KeyIcon } from "@salt-ds/icons";
import { useMemo } from "react";
import {
  type ApplicationDetails,
  type HealthIssue,
  moduleAccessFilter,
} from "../data/applications";
import { USER_ADMIN_TABLES } from "../data/user-admin-tables";
import { useAdminPaths } from "../data/useAdminPaths";
import { useFilteredCount } from "../data/useFilteredCount";
import {
  AdminLink,
  AppAvatar,
  Metric,
  StatusText,
  useApplicationCategory,
} from "./admin-ui/AdminUi";

import "./ApplicationCard.css";

const classBase = "vuuAdminApplicationCard";

/** Live count of users who can open the application. */
export const useUserCount = (accessRole: string) => {
  const filter = useMemo(() => moduleAccessFilter(accessRole), [accessRole]);
  return useFilteredCount(USER_ADMIN_TABLES.users, "user_id", filter);
};

export const formatCount = ({
  count,
  error,
}: {
  count?: number;
  error?: string;
}) => (error ? "–" : count === undefined ? "…" : count.toLocaleString());

/** "Healthy", or the number of configuration issues. */
export const IssueBadge = ({ issues }: { issues: readonly HealthIssue[] }) =>
  issues.length > 0 ? (
    <span title={issues.map(({ message }) => message).join("\n")}>
      <StatusText status="warning">
        {issues.length} {issues.length === 1 ? "issue" : "issues"}
      </StatusText>
    </span>
  ) : (
    <StatusText status="success">Healthy</StatusText>
  );

/** An application's access summary, linking to the application. */
export const ApplicationCard = ({ entry }: { entry: ApplicationDetails }) => {
  const { application } = entry;
  const users = useUserCount(application.accessRole);
  const category = useApplicationCategory(application.name);
  const paths = useAdminPaths();
  return (
    <Card
      accent="top"
      aria-label={application.title}
      className={classBase}
      role="region"
      style={
        category
          ? {
              ["--saltCard-accent-color" as string]: `var(--salt-category-${category}-bold-background)`,
            }
          : undefined
      }
    >
      <header className={`${classBase}-cardHeader`}>
        <AppAvatar application={application} size={1.75} />
        <span className="vuuAdminUi-stack">
          <H3>{application.title}</H3>
          {application.description ? (
            <Text color="secondary" styleAs="label">
              {application.description}
            </Text>
          ) : null}
        </span>
        <IssueBadge issues={entry.issues} />
      </header>
      <Divider variant="tertiary" />
      <div className={`${classBase}-metrics`}>
        <Metric label="Users with access" value={formatCount(users)} />
        <Metric label="Groups" value={entry.groups.length} />
        <Metric label="Roles" value={entry.roles.length} />
      </div>
      {users.error ? <p role="alert">{users.error}</p> : null}
      <footer className={`${classBase}-cardFooter`}>
        <KeyIcon aria-label="Access role" />
        <Code>{application.accessRole}</Code>
        <AdminLink
          IconComponent={ChevronRightIcon}
          aria-label={`Manage ${application.title}`}
          to={paths.application(application.name)}
        >
          Manage
        </AdminLink>
      </footer>
    </Card>
  );
};
