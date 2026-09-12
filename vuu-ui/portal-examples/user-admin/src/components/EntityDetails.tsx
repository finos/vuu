import { useAdminConfig } from "../data/AdminDataContext";
import {
  columnFor,
  type AdminRecord,
  type Entity,
} from "../data/admin-contract";
import { RelationshipSummary } from "./RelationshipSummary";

const detailFields: Record<Entity, string[]> = {
  users: [
    "username",
    "email",
    "first_name",
    "last_name",
    "enabled",
    "email_verified",
    "password_update_required",
    "last_login",
    "created_at",
  ],
  groups: [
    "group_name",
    "group_path",
    "parent_group_id",
    "user_count",
    "role_count",
  ],
  roles: [
    "role_name",
    "client_identifier",
    "client_name",
    "description",
    "group_count",
    "user_count",
  ],
};

export const EntityDetails = ({
  entity,
  record,
}: {
  entity: Entity;
  record: AdminRecord;
}) => {
  const config = useAdminConfig();
  return (
    <>
      <dl className="vuuIdentityAdmin-details">
        {detailFields[entity].map((field) => {
          const value = record[columnFor(config, entity, field)];
          return value === undefined ? null : (
            <div key={field}>
              <dt>{field.replaceAll("_", " ")}</dt>
              <dd>
                {value === null || value === "" ? "Not set" : String(value)}
              </dd>
            </div>
          );
        })}
      </dl>
      <RelationshipSummary entity={entity} record={record} />
    </>
  );
};
