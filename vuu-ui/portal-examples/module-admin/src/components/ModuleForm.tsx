import {
  type ManagedModule,
  MODULE_NAV_ICONS,
  type ModuleConfig,
} from "@heswell/module-admin/contracts";
import {
  Button,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  MultilineInput,
  Option,
  Spinner,
  Switch,
  Text,
} from "@salt-ds/core";
import {
  ErrorIcon,
  LockedIcon,
  RefreshIcon,
  SuccessCircleIcon,
  UploadIcon,
} from "@salt-ds/icons";
import cx from "clsx";
import { type ChangeEvent, type ReactNode, useId, useRef } from "react";
import { menuSections } from "../data/module-model";
import type { RemoteChecks } from "../data/useRemoteChecks";
import type { DraftField, ModuleDraft } from "../data/useModuleDraft";
import { compareRemote } from "../data/remote-check";
import { effectiveAccessRole } from "@heswell/module-admin/contracts";
import { NavIcon } from "./ui";

const classBase = "vuuModuleForm";

export type FormMode = "create" | "edit";

export interface ModuleFormProps {
  draft: ModuleDraft;
  mode: FormMode;
  modules: readonly ManagedModule[];
  moduleId?: number;
}

export const inputValue = (event: ChangeEvent<Element>) =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value;

/** A labelled form field showing its validation error or helper text. */
export const Field = ({
  children,
  className,
  draft,
  field,
  helper,
  label,
  modified,
  required,
  success,
}: {
  children: ReactNode;
  className?: string;
  draft: ModuleDraft;
  field: keyof ModuleConfig;
  helper?: ReactNode;
  label: string;
  modified?: boolean;
  required?: boolean;
  success?: ReactNode;
}) => {
  const error = draft.visibleErrors[field];
  return (
    <FormField
      className={cx(`${classBase}-field`, className, {
        [`${classBase}-field-modified`]: modified,
      })}
      necessity={required ? "required" : undefined}
      validationStatus={error ? "error" : undefined}
    >
      <FormFieldLabel className={`${classBase}-label`}>
        {label}
        {modified ? (
          <span className={`${classBase}-modified`} title="Modified">
            <span className={`${classBase}-srOnly`}>(modified)</span>
          </span>
        ) : null}
      </FormFieldLabel>
      {children}
      {error ? (
        <FormFieldHelperText>{error}</FormFieldHelperText>
      ) : success ? (
        <FormFieldHelperText className={`${classBase}-success`}>
          <SuccessCircleIcon aria-hidden /> {success}
        </FormFieldHelperText>
      ) : helper ? (
        <FormFieldHelperText>{helper}</FormFieldHelperText>
      ) : null}
    </FormField>
  );
};

const isModified = (
  draft: ModuleDraft,
  mode: FormMode,
  ...fields: (keyof ModuleConfig)[]
) => mode === "edit" && fields.some((field) => field in draft.changes);

const TextField = ({
  draft,
  field,
  mode,
  monospace,
  onBlur,
  placeholder,
  ...props
}: {
  className?: string;
  draft: ModuleDraft;
  field: keyof ModuleConfig;
  helper?: ReactNode;
  label: string;
  mode: FormMode;
  monospace?: boolean;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  success?: ReactNode;
}) => (
  <Field
    draft={draft}
    field={field}
    modified={isModified(draft, mode, field)}
    {...props}
  >
    <Input
      bordered
      className={cx({ [`${classBase}-mono`]: monospace })}
      inputProps={{
        onBlur: () => {
          draft.touch(field);
          onBlur?.();
        },
        placeholder,
        spellCheck: false,
      }}
      onChange={(event) => draft.set(field, inputValue(event) as never)}
      value={String(draft.config[field])}
    />
  </Field>
);

/* ---------------------------------------------------------------- Identity */

const NAV_ICONS = Object.entries(MODULE_NAV_ICONS) as [string, string][];

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const NavIconPicker = ({
  draft,
  mode,
}: {
  draft: ModuleDraft;
  mode: FormMode;
}) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const value = draft.config.navIconUrl;
  const custom = value && !NAV_ICONS.some(([, url]) => url === value);
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (file) {
      draft.set("navIconUrl", await readFile(file));
      draft.touch("navIconUrl");
    }
    event.target.value = "";
  };
  return (
    <Field
      draft={draft}
      field="navIconUrl"
      helper="Shown next to the module in the portal menu"
      label="Navigation icon"
      modified={isModified(draft, mode, "navIconUrl")}
    >
      <div
        className={`${classBase}-icons`}
        role="radiogroup"
        aria-label="Navigation icon"
      >
        {NAV_ICONS.map(([name, url]) => (
          <button
            aria-checked={value === url}
            aria-label={name}
            className={`${classBase}-iconChoice`}
            key={name}
            onClick={() => draft.set("navIconUrl", url)}
            role="radio"
            type="button"
          >
            <NavIcon name={draft.config.name || name} size="small" url={url} />
          </button>
        ))}
        {custom ? (
          <button
            aria-checked
            aria-label="Uploaded icon"
            className={`${classBase}-iconChoice`}
            role="radio"
            type="button"
          >
            <NavIcon name={draft.config.name} size="small" url={value} />
          </button>
        ) : null}
        <Button
          appearance="transparent"
          onClick={() => fileInput.current?.click()}
        >
          <UploadIcon aria-hidden /> Upload SVG…
        </Button>
        {value ? (
          <Button
            appearance="transparent"
            onClick={() => draft.set("navIconUrl", "")}
          >
            Clear
          </Button>
        ) : null}
        <input
          accept="image/svg+xml,image/png"
          hidden
          onChange={onFile}
          ref={fileInput}
          type="file"
        />
      </div>
    </Field>
  );
};

export const IdentityFields = ({ draft, mode }: ModuleFormProps) => (
  <div className={`${classBase}-grid`}>
    <TextField
      draft={draft}
      field="title"
      helper="Shown in the portal menu and window title"
      label="Title"
      mode={mode}
      required
    />
    {mode === "create" ? (
      <TextField
        draft={draft}
        field="name"
        helper="Unique identifier · letters, digits and dashes. Can't be changed later"
        label="Name"
        mode={mode}
        monospace
        required
        success={
          draft.config.name && !draft.errors.name
            ? "Unique identifier · can't be changed later"
            : undefined
        }
      />
    ) : (
      <Field
        draft={draft}
        field="name"
        helper="Name can't be changed once created"
        label="Name"
      >
        <Input
          bordered
          className={cx(`${classBase}-mono`, `${classBase}-locked`)}
          readOnly
          startAdornment={<LockedIcon aria-hidden />}
          value={draft.config.name}
        />
      </Field>
    )}
    <Field
      className={`${classBase}-wide`}
      draft={draft}
      field="description"
      label="Description"
      modified={isModified(draft, mode, "description")}
    >
      <MultilineInput
        bordered
        onChange={(event) => draft.set("description", inputValue(event))}
        rows={2}
        value={draft.config.description}
      />
    </Field>
    {mode === "create" ? (
      <div className={`${classBase}-wide`}>
        <NavIconPicker draft={draft} mode={mode} />
      </div>
    ) : null}
  </div>
);

/* -------------------------------------------------------------- Navigation */

export const NavigationFields = ({
  draft,
  mode,
  moduleId,
  modules,
}: ModuleFormProps) => {
  const listId = useId();
  const isChild = draft.config.parentModuleId !== 0;
  const parents = modules.filter(
    ({ id, parentModuleId }) => parentModuleId === 0 && id !== moduleId,
  );
  const parent = modules.find(({ id }) => id === draft.config.parentModuleId);
  const hasChildren =
    moduleId !== undefined &&
    modules.some(({ parentModuleId }) => parentModuleId === moduleId);
  const touchLocation = (field: DraftField) => () => {
    draft.touch(field);
    draft.touch("location");
  };
  const locationModified = isModified(draft, mode, "location");

  return (
    <div className={`${classBase}-grid`}>
      {isChild ? null : (
        <>
          <Field
            draft={draft}
            field="location"
            helper="Choose an existing section or type to create one"
            label="Menu section"
            modified={locationModified}
            required
          >
            <Input
              bordered
              inputProps={{ list: listId, onBlur: touchLocation("section") }}
              onChange={(event) =>
                draft.setLocation(inputValue(event), draft.label)
              }
              value={draft.section}
            />
            <datalist id={listId}>
              {menuSections(modules).map((section) => (
                <option key={section} value={section} />
              ))}
            </datalist>
          </Field>
          <FormField
            className={`${classBase}-field`}
            necessity="required"
            validationStatus={
              draft.visibleErrors.location ? "error" : undefined
            }
          >
            <FormFieldLabel>Menu label</FormFieldLabel>
            <Input
              bordered
              inputProps={{ onBlur: touchLocation("label") }}
              onChange={(event) =>
                draft.setLocation(draft.section, inputValue(event))
              }
              value={draft.label}
            />
            <FormFieldHelperText>
              Menu location <code>{draft.config.location || "–"}</code>
            </FormFieldHelperText>
          </FormField>
        </>
      )}
      <TextField
        draft={draft}
        field="path"
        helper={
          mode === "create" && !isChild
            ? "Suggested from menu location"
            : "Route within the portal"
        }
        label="Route"
        mode={mode}
        monospace
        placeholder={isChild ? "Optional for child modules" : "/section/label"}
        required={!isChild}
      />
      <Field
        draft={draft}
        field="parentModuleId"
        helper={
          hasChildren
            ? "This module has child modules, so it must stay top-level"
            : "Child modules are opened by their parent and have no menu entry"
        }
        label="Parent module"
        modified={isModified(draft, mode, "parentModuleId")}
      >
        <Dropdown
          bordered
          disabled={hasChildren}
          onSelectionChange={(_, [value]) => {
            draft.set("parentModuleId", Number(value ?? 0));
            draft.touch("parentModuleId");
          }}
          selected={[String(draft.config.parentModuleId)]}
          value={parent ? parent.title : "None – top-level module"}
        >
          <Option value="0">None – top-level module</Option>
          {parents.map((module) => (
            <Option key={module.id} value={String(module.id)}>
              {module.title}
            </Option>
          ))}
        </Dropdown>
      </Field>
    </div>
  );
};

/* ------------------------------------------------------- Module federation */

export const RemoteStatusLine = ({
  config,
  remoteChecks,
}: {
  config: Pick<ModuleConfig, "mfComponent" | "mfScope" | "mfUrl">;
  remoteChecks: RemoteChecks;
}) => {
  const check = compareRemote(config, remoteChecks.manifests[config.mfUrl]);
  if (!check) return null;
  if (check.status === "checking") {
    return (
      <Text className={`${classBase}-remote`} styleAs="label">
        <Spinner size="small" aria-label="Checking" /> Checking remote from this
        browser…
      </Text>
    );
  }
  if (check.status === "unreachable") {
    return (
      <Text
        className={cx(`${classBase}-remote`, `${classBase}-remote-error`)}
        styleAs="label"
      >
        <ErrorIcon aria-hidden /> {check.summary} · {check.items[0]?.detail}
      </Text>
    );
  }
  return (
    <Text
      className={cx(`${classBase}-remote`, {
        [`${classBase}-remote-ok`]: check.status === "ok",
        [`${classBase}-remote-warning`]: check.status === "mismatch",
      })}
      styleAs="label"
    >
      {check.status === "ok" ? (
        <SuccessCircleIcon aria-hidden />
      ) : (
        <ErrorIcon aria-hidden />
      )}
      Checked from this browser: manifest found · exposes{" "}
      {check.exposes.map((name) => `./${name}`).join(", ") || "nothing"}
      {check.elapsedMs !== undefined ? ` · ${check.elapsedMs} ms` : ""}
      {check.status === "mismatch" ? ` · ${check.summary}` : ""}
    </Text>
  );
};

export const CheckRemoteButton = ({
  mfUrl,
  remoteChecks,
}: {
  mfUrl: string;
  remoteChecks: RemoteChecks;
}) => (
  <Button
    appearance="transparent"
    disabled={!/^https?:\/\//.test(mfUrl)}
    onClick={() => remoteChecks.check([mfUrl])}
  >
    <RefreshIcon aria-hidden /> Check remote
  </Button>
);

export const FederationFields = ({
  draft,
  mode,
  remoteChecks,
}: ModuleFormProps & { remoteChecks: RemoteChecks }) => {
  const manifest = remoteChecks.manifests[draft.config.mfUrl];
  const exposes = manifest?.status === "loaded" ? manifest.exposes : [];
  const manifestScope =
    manifest?.status === "loaded" ? manifest.name : undefined;
  const scopeError = draft.visibleErrors.mfScope;
  return (
    <div className={`${classBase}-grid`}>
      <Field
        className={`${classBase}-wide`}
        draft={draft}
        field="mfUrl"
        helper={
          <RemoteStatusLine config={draft.config} remoteChecks={remoteChecks} />
        }
        label="Remote URL"
        modified={isModified(draft, mode, "mfUrl")}
        required
      >
        <Input
          bordered
          className={`${classBase}-mono`}
          inputProps={{
            onBlur: () => {
              draft.touch("mfUrl");
              if (/^https?:\/\/.+/.test(draft.config.mfUrl)) {
                remoteChecks.check([draft.config.mfUrl]);
              }
            },
            placeholder: "https://host:port",
            spellCheck: false,
          }}
          onChange={(event) => draft.set("mfUrl", inputValue(event))}
          value={draft.config.mfUrl}
        />
      </Field>
      <TextField
        draft={draft}
        field="mfScope"
        helper={
          manifestScope &&
          manifestScope !== draft.config.mfScope &&
          !scopeError ? (
            <>
              Manifest declares <code>{manifestScope}</code>{" "}
              <Button
                appearance="transparent"
                onClick={() => draft.set("mfScope", manifestScope)}
              >
                Use it
              </Button>
            </>
          ) : (
            "Name the remote registers under"
          )
        }
        label="Scope"
        mode={mode}
        monospace
        required
      />
      <Field
        draft={draft}
        field="mfComponent"
        helper={
          exposes.length
            ? "Picked from the remote's manifest"
            : "Exposed module, without ./"
        }
        label="Exposed component"
        modified={isModified(draft, mode, "mfComponent")}
        required
      >
        {exposes.length ? (
          <Dropdown
            bordered
            className={`${classBase}-mono`}
            onSelectionChange={(_, [value]) => {
              draft.set("mfComponent", value ?? "");
              draft.touch("mfComponent");
            }}
            selected={
              draft.config.mfComponent ? [draft.config.mfComponent] : []
            }
            value={draft.config.mfComponent}
          >
            {[
              ...new Set(
                [...exposes, draft.config.mfComponent].filter(Boolean),
              ),
            ].map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Dropdown>
        ) : (
          <Input
            bordered
            className={`${classBase}-mono`}
            inputProps={{
              onBlur: () => draft.touch("mfComponent"),
              spellCheck: false,
            }}
            onChange={(event) =>
              draft.set("mfComponent", inputValue(event).replace(/^\.\//, ""))
            }
            value={draft.config.mfComponent}
          />
        )}
      </Field>
    </div>
  );
};

/* ---------------------------------------------------------- Access & status */

export const AccessRoleField = ({ draft, mode, modules }: ModuleFormProps) => {
  const isChild = draft.config.parentModuleId !== 0;
  const inherited = isChild
    ? effectiveAccessRole(
        { accessRole: "", parentModuleId: draft.config.parentModuleId },
        modules,
      )
    : "";
  return (
    <TextField
      draft={draft}
      field="accessRole"
      helper={
        isChild
          ? inherited
            ? `Leave empty to inherit ${inherited} from the parent`
            : "Leave empty to inherit the parent's role"
          : mode === "create"
            ? "Derived from name. Grant it to groups in User Admin"
            : "Users need this role to open the module. Grant it in User Admin"
      }
      label="Access role"
      mode={mode}
      monospace
      placeholder={inherited ? `Inherits ${inherited}` : "module-name-access"}
    />
  );
};

export const EnabledField = ({
  draft,
  label = "Enabled",
  mode,
}: {
  draft: ModuleDraft;
  label?: string;
  mode: FormMode;
}) => (
  <Field
    draft={draft}
    field="enabled"
    helper={
      draft.config.enabled
        ? undefined
        : "Disabled modules are hidden from every user"
    }
    label="Status"
    modified={isModified(draft, mode, "enabled")}
  >
    <Switch
      checked={draft.config.enabled}
      label={label}
      onChange={(event) => draft.set("enabled", event.target.checked)}
    />
  </Field>
);
