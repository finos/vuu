import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import {
  applicationForGroupName,
  classifyRole,
  groupNameFromPath,
} from "../data/applications";
import { useApplications } from "../data/useApplicationModel";

import "./ApplicationCell.css";

export const GROUP_APPLICATION_CELL_RENDERER = "vuu-admin-group-application";
export const ROLE_APPLICATION_CELL_RENDERER = "vuu-admin-role-application";

const classBase = "vuuAdminApplicationCell";

const Unassigned = () => (
  <span className={`${classBase}-unassigned`}>Unassigned</span>
);

/**
 * Renders the application a group belongs to, derived from `group_path`
 * whichever column it is attached to.
 */
export const GroupApplicationCell = ({ dataRow }: TableCellRendererProps) => {
  const { applications } = useApplications();
  const application = applicationForGroupName(
    applications,
    groupNameFromPath(dataRow.group_path),
  );
  return application ? application.title : <Unassigned />;
};

/** Renders the application a role belongs to, from its client and role name. */
export const RoleApplicationCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const { applications } = useApplications();
  const match = classifyRole(
    applications,
    dataRow.role_name,
    dataRow[column.name],
  );
  if (!match) return <Unassigned />;
  return (
    <span className={classBase}>
      {match.application.title}
      {match.kind === "access" ? (
        <span className={`${classBase}-tag`} title="Portal access role">
          Access
        </span>
      ) : null}
    </span>
  );
};

registerComponent(
  GROUP_APPLICATION_CELL_RENDERER,
  GroupApplicationCell,
  "cell-renderer",
  { serverDataType: "string", userCanAssign: false },
);
registerComponent(
  ROLE_APPLICATION_CELL_RENDERER,
  RoleApplicationCell,
  "cell-renderer",
  { serverDataType: "string", userCanAssign: false },
);
