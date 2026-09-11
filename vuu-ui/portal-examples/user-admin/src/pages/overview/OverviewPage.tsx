import {
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  SidePanelTitle,
} from "@salt-ds/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminSearch } from "../../components/AdminSearch";
import { AdminTable } from "../../components/AdminTable";
import { EntityDetails } from "../../components/EntityDetails";
import { useAdminConfig } from "../../data/AdminDataContext";
import {
  columnFor,
  ENTITY_LABELS,
  NAME_FIELDS,
  type AdminRecord,
  type AdminTableName,
  type Entity,
} from "../../data/admin-contract";
import { useAdminCount } from "../../data/useAdminTable";

const StatCard = ({ name, label }: { name: AdminTableName; label: string }) => {
  const { count, error } = useAdminCount(name);
  return (
    <section className="vuuIdentityAdmin-stat" aria-label={label}>
      <h3>{label}</h3>
      <strong>
        {error
          ? "Unavailable"
          : count === undefined
            ? "Loading..."
            : count.toLocaleString()}
      </strong>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
};

export const OverviewPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    entity: Entity;
    record: AdminRecord;
  }>();
  const config = useAdminConfig();
  return (
    <section className="vuuIdentityAdmin-page vuuIdentityAdmin-overview">
      <header className="vuuIdentityAdmin-pageHeader">
        <div>
          <h2>Overview</h2>
          <p>Explore identities, memberships and client-role access.</p>
        </div>
      </header>
      <div className="vuuIdentityAdmin-stats">
        <StatCard name="users" label="Users" />
        <StatCard name="groups" label="Groups" />
        <StatCard name="roles" label="Client roles" />
        <StatCard name="clients" label="Clients" />
      </div>
      <nav aria-label="Quick actions" className="vuuIdentityAdmin-quickActions">
        <strong>Quick actions</strong>
        <Link to="../users?create=true">Create user</Link>
        <Link to="../groups?create=true">Create group</Link>
        <Link to="../roles?create=true">Create client role</Link>
      </nav>
      <AdminSearch
        label="Search users, groups and client roles"
        onSearch={(value) => {
          setSelected(undefined);
          setSearch(value);
        }}
      />
      <SidePanelProvider
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      >
        <div className="vuuIdentityAdmin-split">
          <div className="vuuIdentityAdmin-searchResults">
            {search ? (
              (["users", "groups", "roles"] as const).map((entity) => (
                <AdminTable
                  key={`${entity}:${search}`}
                  name={entity}
                  query={{ search }}
                  title={ENTITY_LABELS[entity]}
                  onSelect={(record) =>
                    setSelected(record ? { entity, record } : undefined)
                  }
                />
              ))
            ) : (
              <p className="vuuIdentityAdmin-empty">
                Search across users, groups and client roles. Select a result to
                inspect its relationships.
              </p>
            )}
          </div>
          <SidePanel position="right" className="vuuIdentityAdmin-panel">
            <SidePanelHeader>
              <SidePanelTitle>
                {selected
                  ? String(
                      selected.record[
                        columnFor(
                          config,
                          selected.entity,
                          NAME_FIELDS[selected.entity],
                        )
                      ] ?? ENTITY_LABELS[selected.entity],
                    )
                  : "Identity details"}
              </SidePanelTitle>
              <SidePanelCloseButton />
            </SidePanelHeader>
            <SidePanelContent>
              {selected ? (
                <EntityDetails
                  entity={selected.entity}
                  record={selected.record}
                />
              ) : null}
            </SidePanelContent>
          </SidePanel>
        </div>
      </SidePanelProvider>
    </section>
  );
};
