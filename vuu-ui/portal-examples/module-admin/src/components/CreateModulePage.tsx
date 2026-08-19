import {
  EMPTY_MODULE_CONFIG,
  type ManagedModule,
  type ModuleConfig,
} from "@heswell/module-admin/contracts";
import { Button, Link, Switch, Tag, Text } from "@salt-ds/core";
import {
  ChevronRightIcon,
  FolderClosedIcon,
  SuccessCircleIcon,
} from "@salt-ds/icons";
import cx from "clsx";
import { type ReactNode, useState } from "react";
import {
  splitLocation,
  sortModules,
  toModuleViews,
} from "../data/module-model";
import { type ModuleDraft, useModuleDraft } from "../data/useModuleDraft";
import type { RemoteChecks } from "../data/useRemoteChecks";
import { ErrorCount } from "./EditModulePanel";
import {
  AccessRoleField,
  CheckRemoteButton,
  ConnectionFields,
  FederationFields,
  IdentityFields,
  NavigationFields,
  useConnectionToggle,
} from "./ModuleForm";
import { EnabledStatus, FactList, NavIcon } from "./ui";

const classBase = "vuuModuleCreate";

const SECTION_FIELDS: Record<string, (keyof ModuleConfig)[]> = {
  federation: ["mfUrl", "mfScope", "mfComponent"],
  identity: ["title", "name", "description", "navIconUrl"],
  navigation: ["location", "path", "parentModuleId"],
};

const FormSection = ({
  action,
  children,
  description,
  draft,
  id,
  number,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  draft: ModuleDraft;
  id: keyof typeof SECTION_FIELDS;
  number: number;
  title: string;
}) => {
  const fields = SECTION_FIELDS[id];
  const hasError = fields.some((field) => draft.visibleErrors[field]);
  const complete = fields.every((field) => !draft.errors[field]);
  return (
    <section
      aria-labelledby={`${classBase}-${id}`}
      className={`${classBase}-card`}
    >
      <header className={`${classBase}-cardHeader`}>
        <span
          className={cx(`${classBase}-step`, {
            [`${classBase}-step-complete`]: complete,
            [`${classBase}-step-error`]: hasError,
          })}
        >
          {complete ? <SuccessCircleIcon aria-label="Complete" /> : number}
        </span>
        <h2 id={`${classBase}-${id}`}>{title}</h2>
        <Text color="secondary">{description}</Text>
        <span className={`${classBase}-spacer`} />
        {action}
      </header>
      <div className={`${classBase}-cardBody`}>{children}</div>
    </section>
  );
};

const PortalMenuPreview = ({
  config,
  modules,
}: {
  config: ModuleConfig;
  modules: readonly ManagedModule[];
}) => {
  const [section] = splitLocation(config.location);
  const sections = new Map<
    string,
    {
      id: number;
      label: string;
      enabled: boolean;
      icon: string;
      name: string;
    }[]
  >();
  const views = sortModules(toModuleViews(modules, {}), "menu");
  for (const module of views) {
    if (module.parentModuleId || !module.location) continue;
    const [name, label] = splitLocation(module.location);
    const items = sections.get(name) ?? [];
    items.push({
      enabled: module.enabled,
      icon: module.navIconUrl,
      id: module.id,
      label,
      name: module.name,
    });
    sections.set(name, items);
  }
  const isChild = config.parentModuleId !== 0;
  if (!isChild && section) {
    const items = sections.get(section) ?? [];
    items.push({
      enabled: true,
      icon: config.navIconUrl,
      id: -1,
      label: splitLocation(config.location)[1] || "…",
      name: config.name || "new",
    });
    items.sort((left, right) => left.label.localeCompare(right.label));
    sections.set(section, items);
  }
  return (
    <div className={`${classBase}-menu`}>
      <Text className={`${classBase}-menuTitle`} styleAs="label">
        Portal menu
      </Text>
      {isChild ? (
        <Text color="secondary">
          Child modules are opened by their parent and have no menu entry.
        </Text>
      ) : (
        [...sections.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([name, items]) => (
            <div key={name}>
              <div className={`${classBase}-menuSection`}>
                <FolderClosedIcon aria-hidden /> {name}
              </div>
              {name === section || sections.size <= 4
                ? items.map((item) => (
                    <div
                      className={cx(`${classBase}-menuItem`, {
                        [`${classBase}-menuItem-new`]: item.id === -1,
                      })}
                      key={item.id}
                    >
                      <NavIcon name={item.name} size="small" url={item.icon} />
                      {item.label}
                      {item.id === -1 ? (
                        <Tag bordered category={1}>
                          New
                        </Tag>
                      ) : !item.enabled ? (
                        <Tag bordered>Disabled</Tag>
                      ) : null}
                    </div>
                  ))
                : null}
            </div>
          ))
      )}
    </div>
  );
};

export interface CreateModulePageProps {
  initial?: ModuleConfig;
  modules: readonly ManagedModule[];
  onCancel: () => void;
  onCreate: (config: ModuleConfig) => Promise<boolean>;
  remoteChecks: RemoteChecks;
  /** Title of the module being duplicated, if any. */
  sourceTitle?: string;
}

export const NEW_MODULE_CONFIG: ModuleConfig = {
  ...EMPTY_MODULE_CONFIG,
  enabled: true,
};

export const CreateModulePage = ({
  initial = NEW_MODULE_CONFIG,
  modules,
  onCancel,
  onCreate,
  remoteChecks,
  sourceTitle,
}: CreateModulePageProps) => {
  const draft = useModuleDraft({ initial, mode: "create", modules });
  const [connection, setConnection] = useConnectionToggle(draft);
  const [saving, setSaving] = useState(false);
  const props = { draft, mode: "create" as const, modules };
  const { config } = draft;
  const [section, label] = splitLocation(config.location);

  const submit = async (enabled: boolean) => {
    draft.setSubmitted(true);
    const errorCount = enabled
      ? draft.errorCount
      : Object.keys(draft.errors).filter(
          (field) => field !== "accessRole" || draft.config.accessRole,
        ).length;
    if (errorCount > 0) return;
    setSaving(true);
    await onCreate({ ...config, enabled });
    setSaving(false);
  };

  return (
    <div className={classBase}>
      <div className={`${classBase}-scroll`}>
        <nav aria-label="Breadcrumb" className={`${classBase}-breadcrumb`}>
          <Link
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onCancel();
            }}
          >
            Modules
          </Link>
          <ChevronRightIcon aria-hidden />
          <Text>New module</Text>
        </nav>
        <h1 className={`${classBase}-title`}>New module</h1>
        <Text color="secondary">
          {sourceTitle
            ? `Duplicating ${sourceTitle}. Give the copy its own name, route and scope.`
            : "Register a remote module with module discovery. It becomes available to users holding its access role once enabled."}
        </Text>
        <div className={`${classBase}-layout`}>
          <div className={`${classBase}-main`}>
            <FormSection
              description="How the module is named and described"
              draft={draft}
              id="identity"
              number={1}
              title="Identity"
            >
              <IdentityFields {...props} />
            </FormSection>
            <FormSection
              description="Where the module appears and its route"
              draft={draft}
              id="navigation"
              number={2}
              title="Portal navigation"
            >
              <NavigationFields {...props} />
            </FormSection>
            <FormSection
              action={
                <CheckRemoteButton
                  mfUrl={config.mfUrl}
                  remoteChecks={remoteChecks}
                />
              }
              description="Where the remote is loaded from"
              draft={draft}
              id="federation"
              number={3}
              title="Module federation"
            >
              <FederationFields {...props} remoteChecks={remoteChecks} />
            </FormSection>
          </div>
          <div className={`${classBase}-side`}>
            <section aria-label="Preview" className={`${classBase}-card`}>
              <header className={`${classBase}-cardHeader`}>
                <h2>Preview</h2>
              </header>
              <div className={`${classBase}-cardBody`}>
                <div className={`${classBase}-preview`}>
                  <div className={`${classBase}-previewHeader`}>
                    <NavIcon
                      name={config.name || "new"}
                      url={config.navIconUrl}
                    />
                    <div>
                      <strong>{config.title || "Untitled module"}</strong>
                      <code>{config.name || "name"} · v1</code>
                    </div>
                    <EnabledStatus enabled={config.enabled} />
                  </div>
                  {config.description ? (
                    <Text>{config.description}</Text>
                  ) : null}
                  <FactList
                    facts={[
                      [
                        "Menu",
                        config.parentModuleId
                          ? `Opened from ${modules.find(({ id }) => id === config.parentModuleId)?.title ?? "parent"}`
                          : section
                            ? `${section} › ${label || "…"}`
                            : "–",
                      ],
                      ["Route", <code key="r">{config.path || "–"}</code>],
                    ]}
                  />
                </div>
                <PortalMenuPreview config={config} modules={modules} />
              </div>
            </section>
            <section
              aria-label="Access and connection"
              className={`${classBase}-card`}
            >
              <header className={`${classBase}-cardHeader`}>
                <h2>Access &amp; connection</h2>
              </header>
              <div className={`${classBase}-cardBody ${classBase}-stack`}>
                <AccessRoleField {...props} />
                <Switch
                  checked={connection}
                  label="Uses a dedicated Vuu connection"
                  onChange={(event) => setConnection(event.target.checked)}
                />
                {connection ? <ConnectionFields {...props} /> : null}
              </div>
            </section>
          </div>
        </div>
      </div>
      <footer className={`${classBase}-footer`}>
        <ErrorCount count={draft.submitted ? draft.errorCount : 0} />
        {draft.submitted && draft.errorCount > 0 ? (
          <Text color="secondary">Fix the highlighted fields to continue</Text>
        ) : null}
        <span className={`${classBase}-spacer`} />
        <Button appearance="transparent" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          appearance="bordered"
          disabled={saving}
          onClick={() => submit(false)}
        >
          Save as disabled
        </Button>
        <Button
          disabled={saving}
          onClick={() => submit(true)}
          sentiment="accented"
        >
          {saving ? "Creating…" : "Create module"}
        </Button>
      </footer>
    </div>
  );
};
