import { Button } from "@salt-ds/core";
import { EditSession } from "@vuu-ui/vuu-data-editing";
import type { DataSource, EditApi, TableSchema } from "@vuu-ui/vuu-data-types";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { isRpcError, Range } from "@vuu-ui/vuu-utils";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAdminConfig } from "../data/AdminDataContext";
import {
  columnFor,
  errorMessage,
  type AdminRecord,
  type Entity,
} from "../data/admin-contract";
import {
  mutationFields,
  saveAdminEntity,
  saveAdminRelationship,
  type RelationshipChange,
} from "../data/admin-mutations";
import { GroupForm } from "../pages/groups/GroupForm";
import { RoleForm } from "../pages/roles/RoleForm";
import { UserForm } from "../pages/users/UserForm";
import { FORM_FIELDS, REQUIRED_FIELDS } from "./AdminFormField";
import { AdminRelationshipField } from "./AdminRelationshipField";
import { ModuleAccessField } from "./ModuleAccessField";

export interface AdminEditFormProps {
  entity: Entity;
  dataSource: DataSource;
  schema: TableSchema;
  record?: AdminRecord;
  onClose: () => void;
}

// EditSession.end currently handles rejected promises, but not ERROR_RESULT replies.
// Adapt only this editor's session; never replace methods on the shared source.
const checkedSessionSource = (source: DataSource): EditApi => ({
  createSessionDataSource: async (...args) => {
    if (!source.createSessionDataSource)
      throw new Error(
        "Backend contract unavailable: Vuu edit sessions are not supported.",
      );
    const session = await source.createSessionDataSource(...args);
    if (!session) throw new Error("Vuu did not return an edit session.");
    return new Proxy(session, {
      get(target, property) {
        if (property === "endEditSession")
          return async (save?: boolean, force?: boolean) => {
            if (!target.endEditSession)
              throw new Error(
                "Backend contract unavailable: ending edit sessions is not supported.",
              );
            const result = await target.endEditSession(save, force);
            if (isRpcError(result)) throw new Error(result.errorMessage);
            target.unsubscribe();
            return result;
          };
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  },
});

interface EditorRun {
  session: EditSession;
  disposed: boolean;
  busy: boolean;
  persisted: boolean;
  relationshipIndex: number;
  notified?: boolean;
  task: Promise<void>;
}

export const AdminEditForm = ({
  entity,
  dataSource,
  schema,
  record,
  onClose,
}: AdminEditFormProps) => {
  const config = useAdminConfig();
  const { showNotification } = useNotifications();
  const [values, setValues] = useState<AdminRecord>(() =>
    Object.fromEntries(
      FORM_FIELDS[entity].map((field) => [
        field,
        field === "temporary_password"
          ? ""
          : (record?.[columnFor(config, entity, field)] ??
            (field === "enabled" ? true : "")),
      ]),
    ),
  );
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const [relationships, setRelationships] = useState<RelationshipChange[]>([]);
  const [editSchema, setEditSchema] = useState<TableSchema>();
  const runRef = useRef<EditorRun | undefined>(undefined);
  const cleanupBarrier = useRef(Promise.resolve());
  const notifyRef = useRef(showNotification);
  notifyRef.current = showNotification;
  const supports = (field: string) =>
    mutationFields(entity).includes(field) &&
    (field === "temporary_password" ||
      (editSchema ?? schema).columns.some(
        (column) =>
          column.name === columnFor(config, entity, field) &&
          column.editable !== false,
      ));
  const missingRequired = REQUIRED_FIELDS[entity].some(
    (field) => !supports(field),
  );
  const report = (cause: unknown, run: EditorRun) => {
    const message = errorMessage(cause);
    if (!run.disposed) setError(message);
    notifyRef.current({
      type: "toast",
      status: "error",
      header: "Identity edit failed",
      content: message,
      dismissal: "manual",
    });
  };
  const reportRef = useRef(report);
  reportRef.current = report;

  useEffect(() => {
    const run: EditorRun = {
      session: new EditSession({
        dataSource: checkedSessionSource(dataSource),
      }),
      disposed: false,
      busy: false,
      persisted: false,
      relationshipIndex: 0,
      task: Promise.resolve(),
    };
    runRef.current = run;
    setReady(false);
    setEditSchema(undefined);
    setError(undefined);
    run.task = cleanupBarrier.current
      .then(async () => {
        if (run.disposed) return;
        if (
          record &&
          (typeof record.key !== "string" ||
            !record.key ||
            dataSource.selectedRowsCount !== 1)
        ) {
          throw new Error(
            "Select exactly one entity before editing. The Vuu row key and single selection are required.",
          );
        }
        const sessionSource = await run.session.begin(
          record ? "Selected" : "Empty",
        );
        // Session creation returns an unsubscribed datasource. Establish its RPC
        // viewport even when closing during begin, so cleanup can end the session.
        await sessionSource.subscribe({ range: Range(0, 1) }, (message) => {
          if (message.type === "subscribe-failed") {
            if (!run.disposed) setReady(false);
            reportRef.current(new Error(message.msg), run);
          } else if (message.type === "subscribed") {
            if (message.tableSchema.key !== schema.key) {
              reportRef.current(
                new Error(
                  "Backend contract unavailable: the session row key differs from the entity key.",
                ),
                run,
              );
            } else if (!run.disposed) {
              setEditSchema(message.tableSchema);
              setReady(true);
            }
          }
        });
      })
      .catch((cause) => reportRef.current(cause, run));
    return () => {
      run.disposed = true;
      // Wait for begin and all pending writes before discarding, including StrictMode replay.
      cleanupBarrier.current = run.task
        .then(async () => {
          const sessionSource = run.session.sessionDataSource;
          try {
            await run.session.end(false);
          } finally {
            if (run.session.sessionDataSource) sessionSource?.unsubscribe();
          }
        })
        .catch((cause) => reportRef.current(cause, run));
    };
  }, [dataSource, record, schema]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const run = runRef.current;
    if (!run || run.busy || !ready || missingRequired) return;
    const missing = REQUIRED_FIELDS[entity].find(
      (field) => !String(values[field] ?? "").trim(),
    );
    if (missing) {
      reportRef.current(
        new Error(`${missing.replaceAll("_", " ")} is required.`),
        run,
      );
      return;
    }
    run.busy = true;
    setBusy(true);
    setError(undefined);
    run.task = run.task
      .then(async () => {
        if (run.disposed) return;
        const fields = FORM_FIELDS[entity].filter(
          (field) =>
            supports(field) &&
            (field !== "temporary_password" || values[field] !== ""),
        );
        const rpcValues = Object.fromEntries(
          fields.map((field) => [
            columnFor(config, entity, field),
            values[field],
          ]),
        );
        if (entity === "roles") {
          // Selection metadata validates the target but is never a mutable RPC field.
          rpcValues[columnFor(config, entity, "client_identifier")] =
            values.client_identifier;
        }
        if (!run.persisted) {
          // Generic session saves only update Vuu's table, not the identity provider.
          // Drafts stay local; only the confirmed domain RPC persists the entity.
          await saveAdminEntity(dataSource, entity, rpcValues, config, record);
          run.persisted = true;
          if (!run.disposed) setPersisted(true);
        }
        if (run.disposed) return;
        if (entity !== "roles") {
          while (run.relationshipIndex < relationships.length) {
            if (!record)
              throw new Error(
                "Relationship changes require an existing identity.",
              );
            await saveAdminRelationship(
              dataSource,
              entity,
              config,
              relationships[run.relationshipIndex],
              record,
            );
            run.relationshipIndex++;
            if (run.disposed) return;
          }
        }
        if (!run.notified) {
          notifyRef.current({
            type: "toast",
            status: "success",
            header: "Identity saved",
            content: "The identity service confirmed your changes.",
          });
          run.notified = true;
        }
        await run.session.end(false);
        if (!run.disposed) onClose();
      })
      .catch((cause) => reportRef.current(cause, run))
      .finally(() => {
        run.busy = false;
        if (!run.disposed) setBusy(false);
      });
  };

  const discard = () => {
    const run = runRef.current;
    if (!run || run.busy) return;
    run.busy = true;
    setBusy(true);
    setError(undefined);
    run.task = run.task
      .then(async () => {
        await run.session.end(false);
        if (!run.disposed) onClose();
      })
      .catch((cause) => reportRef.current(cause, run))
      .finally(() => {
        run.busy = false;
        if (!run.disposed) setBusy(false);
      });
  };
  const Fields =
    entity === "users" ? UserForm : entity === "groups" ? GroupForm : RoleForm;
  return (
    <form className="vuuIdentityAdmin-form" onSubmit={save}>
      {!ready && !error ? <p role="status">Starting edit session...</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {missingRequired ? (
        <p role="alert">
          Backend contract unavailable: required fields are not writable. Saving
          is disabled.
        </p>
      ) : null}
      {persisted ? (
        <p role="status">
          Identity fields are saved. Retry Save to finish pending relationships
          and close the editor. Close keeps confirmed changes and abandons
          remaining operations; saved changes cannot be discarded.
        </p>
      ) : null}
      <Fields
        values={values}
        supports={supports}
        editing={!!record}
        disabled={!ready || busy || persisted}
        relationships={
          entity === "groups" ? (
            <AdminRelationshipField
              entity={entity}
              record={record}
              disabled={!ready || busy || persisted}
              changes={relationships}
              onChange={setRelationships}
            />
          ) : undefined
        }
        onChange={(field, value) =>
          setValues((previous) => ({ ...previous, [field]: value }))
        }
      />
      {entity === "users" ? <ModuleAccessField record={record} /> : null}
      <div className="vuuIdentityAdmin-formActions">
        <Button type="submit" disabled={!ready || busy || missingRequired}>
          Save
        </Button>
        <Button type="button" disabled={busy} onClick={discard}>
          {persisted ? "Close" : record ? "Discard" : "Cancel"}
        </Button>
      </div>
    </form>
  );
};
