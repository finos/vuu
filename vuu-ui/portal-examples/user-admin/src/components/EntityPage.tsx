import {
  Button,
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  SidePanelTitle,
} from "@salt-ds/core";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAdminConfig } from "../data/AdminDataContext";
import {
  columnFor,
  ENTITY_LABELS,
  ENTITY_NAMES,
  NAME_FIELDS,
  type AdminRecord,
  type Entity,
} from "../data/admin-contract";
import { useAdminTable } from "../data/useAdminTable";
import { AdminEditForm } from "./AdminEditForm";
import { AdminSearch } from "./AdminSearch";
import { AdminTableView } from "./AdminTable";
import { EntityDetails } from "./EntityDetails";
import { useEditingLock } from "./EditingContext";

export const EntityPage = ({ entity }: { entity: Entity }) => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [record, setRecord] = useState<AdminRecord>();
  const [editing, setEditing] = useState(params.get("create") === "true");
  const resource = useAdminTable(entity, { search });
  const config = useAdminConfig();
  const setEditingLock = useEditingLock();
  const { dataSource, schema } = resource;
  useEffect(() => {
    setEditingLock(editing);
    return () => setEditingLock(false);
  }, [editing, setEditingLock]);

  const close = () => {
    setEditing(false);
    setRecord(undefined);
    dataSource?.select?.({ type: "DESELECT_ALL" });
    if (params.has("create")) {
      const next = new URLSearchParams(params);
      next.delete("create");
      setParams(next, { replace: true });
    }
  };
  const title = editing
    ? `${record ? "Edit" : "Create"} ${ENTITY_NAMES[entity].toLowerCase()}`
    : record
      ? String(
          record[columnFor(config, entity, NAME_FIELDS[entity])] ??
            ENTITY_NAMES[entity],
        )
      : "";

  return (
    <section className="vuuIdentityAdmin-page">
      <header className="vuuIdentityAdmin-pageHeader">
        <div>
          <h2>{ENTITY_LABELS[entity]}</h2>
          <p>
            Manage{" "}
            {entity === "roles"
              ? "client roles and their group assignments"
              : `${entity} and their access`}
            .
          </p>
        </div>
        <Button
          disabled={editing || !dataSource}
          onClick={() => {
            setRecord(undefined);
            setEditing(true);
          }}
        >
          Create {ENTITY_NAMES[entity].toLowerCase()}
        </Button>
      </header>
      <fieldset disabled={editing} className="vuuIdentityAdmin-searchFieldset">
        <AdminSearch
          label={`Search ${ENTITY_LABELS[entity].toLowerCase()}`}
          onSearch={(value) => {
            close();
            setSearch(value);
          }}
        />
      </fieldset>
      <SidePanelProvider
        open={editing || !!record}
        onOpenChange={(open) => {
          if (!open && !editing) close();
        }}
      >
        <div className="vuuIdentityAdmin-split">
          <AdminTableView
            name={entity}
            resource={resource}
            selectionDisabled={editing}
            onSelect={setRecord}
            title={ENTITY_LABELS[entity]}
          />
          <SidePanel position="right" className="vuuIdentityAdmin-panel">
            <SidePanelHeader>
              <SidePanelTitle>{title}</SidePanelTitle>
              {!editing ? <SidePanelCloseButton /> : null}
            </SidePanelHeader>
            <SidePanelContent>
              {editing ? (
                dataSource && schema ? (
                  <AdminEditForm
                    entity={entity}
                    dataSource={dataSource}
                    schema={schema}
                    record={record}
                    onClose={close}
                  />
                ) : (
                  <>
                    <p role={resource.error ? "alert" : "status"}>
                      {resource.error ?? "Loading editor..."}
                    </p>
                    <Button onClick={close}>Cancel</Button>
                  </>
                )
              ) : record ? (
                <>
                  <Button onClick={() => setEditing(true)}>
                    Edit {ENTITY_NAMES[entity].toLowerCase()}
                  </Button>
                  <EntityDetails entity={entity} record={record} />
                </>
              ) : null}
            </SidePanelContent>
          </SidePanel>
        </div>
      </SidePanelProvider>
    </section>
  );
};
