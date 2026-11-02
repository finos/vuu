import { StatusIndicator } from "@salt-ds/core";
import type { HealthIssue } from "../data/applications";
import { StatusText } from "./admin-ui/AdminUi";

/** Configuration issues, or a note that there are none. */
export const IssueList = ({ issues }: { issues: readonly HealthIssue[] }) =>
  issues.length === 0 ? (
    <p role="status">
      <StatusText status="success">No configuration issues found.</StatusText>
    </p>
  ) : (
    <ul className="vuuIdentityAdmin-issues" aria-label="Configuration issues">
      {issues.map((issue) => (
        <li key={`${issue.code}:${issue.message}`}>
          <StatusIndicator status="warning" />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
