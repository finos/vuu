import { useAdminConfig } from "../data/AdminDataContext";
import {
  columnFor,
  type AdminRecord,
  type Entity,
} from "../data/admin-contract";
import { AdminTable } from "./AdminTable";

export const RelationshipSummary = ({
  entity,
  record,
}: {
  entity: Entity;
  record: AdminRecord;
}) => {
  const config = useAdminConfig();
  const idField =
    entity === "users"
      ? "user_id"
      : entity === "groups"
        ? "group_id"
        : "role_id";
  const id = record[columnFor(config, entity, idField)];
  if (id === undefined || id === null || id === "") {
    return (
      <p role="alert">
        Relationship data requires the server's {idField} column.
      </p>
    );
  }
  const query = { equals: { field: idField, value: String(id) } };
  return (
    <div className="vuuIdentityAdmin-relationships">
      {entity === "users" ? (
        <>
          <AdminTable
            name="user_groups"
            query={query}
            title="Group memberships"
          />
          <AdminTable
            name="user_group_roles"
            query={query}
            title="Client roles through groups"
          />
        </>
      ) : entity === "groups" ? (
        <>
          <AdminTable
            name="user_groups"
            query={query}
            title="Users in this group"
          />
          <AdminTable
            name="group_roles"
            query={query}
            title="Assigned client roles"
          />
        </>
      ) : (
        <>
          <AdminTable
            name="group_roles"
            query={query}
            title="Groups assigned this role"
          />
          <AdminTable
            name="user_group_roles"
            query={query}
            title="Users reached through groups"
          />
        </>
      )}
    </div>
  );
};
