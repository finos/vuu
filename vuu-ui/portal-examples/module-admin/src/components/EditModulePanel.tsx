import type {
  ManagedModule,
  ModuleConfig,
} from "@heswell/module-admin/contracts";
import { Banner, BannerContent, Button, Switch, Text } from "@salt-ds/core";
import { EditIcon, ErrorIcon } from "@salt-ds/icons";
import { useMemo, useState } from "react";
import { FIELD_LABELS, type ModuleView, toConfig } from "../data/module-model";
import { useModuleDraft } from "../data/useModuleDraft";
import type { RemoteChecks } from "../data/useRemoteChecks";
import {
  AccessRoleField,
  ConnectionFields,
  EnabledField,
  FederationFields,
  IdentityFields,
  NavIconPicker,
  NavigationFields,
  useConnectionToggle,
} from "./ModuleForm";
import { PanelHeader } from "./ModuleDetailsPanel";
import { SectionHeading } from "./ui";

const classBase = "vuuModulePanel";

const display = (value: ModuleConfig[keyof ModuleConfig]) =>
  value === ""
    ? "–"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : String(value);

export const ErrorCount = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="vuuModuleAdmin-errorCount">
      <ErrorIcon aria-hidden /> {count} {count === 1 ? "error" : "errors"}
    </span>
  ) : null;

export interface EditModulePanelProps {
  module: ModuleView;
  modules: readonly ManagedModule[];
  onClose: () => void;
  onSave: (
    changes: Partial<ModuleConfig>,
    expectedVersion: number,
  ) => Promise<boolean>;
  remoteChecks: RemoteChecks;
}

export const EditModulePanel = ({
  module,
  modules,
  onClose,
  onSave,
  remoteChecks,
}: EditModulePanelProps) => {
  // The draft is based on the module as it was when editing started.
  const [base] = useState(() => ({
    config: toConfig(module),
    version: module.version,
  }));
  const initial = useMemo(() => base.config, [base]);
  const draft = useModuleDraft({
    initial,
    mode: "edit",
    moduleId: module.id,
    modules,
  });
  const [connection, setConnection] = useConnectionToggle(draft);
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const changedFields = Object.keys(draft.changes) as (keyof ModuleConfig)[];
  const movedOn = module.version !== base.version;
  const props = { draft, mode: "edit" as const, moduleId: module.id, modules };

  const save = async () => {
    draft.setSubmitted(true);
    if (draft.errorCount > 0 || !draft.dirty) return;
    setSaving(true);
    const saved = await onSave(draft.changes, base.version);
    setSaving(false);
    if (saved) onClose();
  };

  return (
    <aside aria-label={`Edit ${module.title}`} className={classBase}>
      <PanelHeader
        eyebrow="Editing"
        module={module}
        onClose={onClose}
        subtitle={`${module.name} · version ${base.version}${draft.dirty ? ` → ${base.version + 1}` : ""}`}
      />
      {movedOn ? (
        <Banner status="warning">
          <BannerContent>
            This module was changed elsewhere (now version {module.version}).
            Saving will be rejected; discard and edit again to pick up the
            changes.
          </BannerContent>
        </Banner>
      ) : null}
      {draft.dirty ? (
        <div className={`${classBase}-dirty`}>
          <div className={`${classBase}-dirtySummary`}>
            <EditIcon aria-hidden />
            <strong>
              {changedFields.length} unsaved{" "}
              {changedFields.length === 1 ? "change" : "changes"}
            </strong>
            <Text color="secondary">
              · {changedFields.map((field) => FIELD_LABELS[field]).join(", ")}
            </Text>
            <Button
              appearance="transparent"
              onClick={() => setReview((open) => !open)}
            >
              {review ? "Hide" : "Review"}
            </Button>
          </div>
          {review ? (
            <dl className={`${classBase}-diff`}>
              {changedFields.map((field) => (
                <div key={field}>
                  <dt>{FIELD_LABELS[field]}</dt>
                  <dd>
                    <del>{display(initial[field])}</del>
                    <ins>{display(draft.config[field])}</ins>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
      <div className={`${classBase}-body ${classBase}-form`}>
        <section>
          <SectionHeading>Identity</SectionHeading>
          <IdentityFields {...props} />
          <NavIconPicker draft={draft} mode="edit" />
        </section>
        <section>
          <SectionHeading>Portal navigation</SectionHeading>
          <NavigationFields {...props} />
        </section>
        <section>
          <SectionHeading>Module federation</SectionHeading>
          <FederationFields {...props} remoteChecks={remoteChecks} />
        </section>
        <section>
          <div className={`${classBase}-sectionToggle`}>
            <SectionHeading>Vuu connection</SectionHeading>
            <Switch
              aria-label="Uses a dedicated Vuu connection"
              checked={connection}
              onChange={(event) => setConnection(event.target.checked)}
            />
          </div>
          {connection ? (
            <ConnectionFields {...props} />
          ) : (
            <Text color="secondary">
              Uses the portal's default Vuu connection.
            </Text>
          )}
        </section>
        <section>
          <SectionHeading>Access &amp; status</SectionHeading>
          <div className="vuuModuleForm-grid">
            <AccessRoleField {...props} />
            <EnabledField draft={draft} mode="edit" />
          </div>
        </section>
      </div>
      <footer className={`${classBase}-footer`}>
        <ErrorCount
          count={draft.submitted || draft.dirty ? draft.errorCount : 0}
        />
        <span className={`${classBase}-spacer`} />
        <Button
          appearance="transparent"
          onClick={draft.dirty ? draft.reset : onClose}
        >
          {draft.dirty ? "Discard" : "Close"}
        </Button>
        <Button
          disabled={!draft.dirty || saving || movedOn}
          onClick={save}
          sentiment="accented"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </footer>
    </aside>
  );
};
