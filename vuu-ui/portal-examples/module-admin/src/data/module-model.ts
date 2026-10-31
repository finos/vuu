import {
  type ManagedModule,
  effectiveAccessRole,
  isChildModule,
} from "@heswell/module-admin/contracts";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  compareRemote,
  type ManifestResult,
  type RemoteCheck,
} from "./remote-check";

const text = (value: unknown) => (typeof value === "string" ? value : "");
const int = (value: unknown) =>
  typeof value === "number" ? value : Number(value) || 0;

/** Joins rows of the modules and modulePermissions tables. */
export const toManagedModules = (
  moduleRows: readonly DataRow[],
  permissionRows: readonly DataRow[],
): ManagedModule[] => {
  const roles = new Map<number, string>();
  for (const row of permissionRows) {
    const moduleId = int(row.module_id);
    if (!roles.has(moduleId)) roles.set(moduleId, text(row.role));
  }
  return moduleRows
    .map((row) => {
      const id = int(row.id);
      return {
        accessRole: roles.get(id) ?? "",
        created: int(row.vuuCreatedTimestamp),
        description: text(row.description),
        enabled: row.enabled === true,
        id,
        location: text(row.location),
        mfComponent: text(row.mfComponent),
        mfScope: text(row.mfScope),
        mfUrl: text(row.mfUrl),
        name: text(row.name),
        navIconUrl: text(row.navIconUrl),
        parentModuleId: int(row.parentModuleId),
        path: text(row.path),
        title: text(row.title),
        updated: int(row.vuuUpdatedTimestamp),
        version: int(row.version),
        // Each remote publishes its Vuu connection in its own config.json.
        vuuConnectionId: "",
        vuuRestUrl: "",
        vuuWebsocketUrl: "",
      };
    })
    .sort((left, right) => left.id - right.id);
};

/**
 * The module's definition as it appears in the portal's `modules.yaml`, with
 * the same keys in the same order, for the YAML view and for copying.
 */
export const moduleSource = (module: ManagedModule) => ({
  id: module.id,
  version: module.version,
  created: module.created,
  updated: module.updated,
  parentModuleId: module.parentModuleId,
  name: module.name,
  title: module.title,
  description: module.description,
  enabled: module.enabled,
  location: module.location,
  path: module.path,
  mfComponent: module.mfComponent,
  mfScope: module.mfScope,
  mfUrl: module.mfUrl,
  navIconUrl: module.navIconUrl,
  accessRole: module.accessRole,
});

const YAML_PLAIN_UNSAFE =
  /^$|^\s|\s$|^[-?:,[\]{}#&*!|>'"%@`]|: | #|,|^(true|false|null|~|yes|no|on|off)$|^[-+.]?\d/i;

/** A scalar as YAML: plain where that reads back the same, else quoted. */
const yamlScalar = (value: string | number | boolean) =>
  typeof value !== "string"
    ? String(value)
    : YAML_PLAIN_UNSAFE.test(value)
      ? JSON.stringify(value)
      : value;

/** The module as one entry of the `modules:` list in `modules.yaml`. */
export const moduleSourceYaml = (module: ManagedModule) =>
  Object.entries(moduleSource(module))
    .map(
      ([key, value], index) =>
        `${index === 0 ? "- " : "  "}${key}: ${yamlScalar(value)}`,
    )
    .join("\n");

/** `/Trading/Baskets` => ["Trading", "Baskets"] */
export const splitLocation = (location: string): [string, string] => {
  const [section = "", ...label] = location.replace(/^\//, "").split("/");
  return [section, label.join("/")];
};

/** `http://localhost:5002/` => `localhost:5002` */
export const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

export const menuSections = (modules: readonly ManagedModule[]) =>
  [
    ...new Set(
      modules
        .filter((module) => !isChildModule(module) && module.location)
        .map((module) => splitLocation(module.location)[0])
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));

export type ModuleIssueKind = "noAccessRole" | "remote";

export interface ModuleIssue {
  kind: ModuleIssueKind;
  /** One line naming the problem. */
  message: string;
  /** What the problem means, or what the check reported. */
  detail: string;
}

/** A module enriched with what the UI needs to present it. */
export interface ModuleView extends ManagedModule {
  accessRoleInherited: boolean;
  children: ManagedModule[];
  effectiveAccessRole: string;
  issues: ModuleIssue[];
  parent?: ManagedModule;
  remote?: RemoteCheck;
}

export const moduleIssues = (
  effectiveRole: string,
  remote?: RemoteCheck,
): ModuleIssue[] => {
  const issues: ModuleIssue[] = [];
  if (!effectiveRole) {
    issues.push({
      detail: "No user can open this module until it has an access role.",
      kind: "noAccessRole",
      message: "No access role",
    });
  }
  if (remote && remote.status !== "ok" && remote.status !== "checking") {
    const failed = [...remote.items, ...remote.configItems].find(
      ({ ok }) => !ok,
    );
    issues.push({
      detail: failed ? `${failed.label}: ${failed.detail}` : "",
      kind: "remote",
      message: remote.summary,
    });
  }
  return issues;
};

export const toModuleViews = (
  modules: readonly ManagedModule[],
  manifests: Readonly<Record<string, ManifestResult>>,
): ModuleView[] =>
  modules.map((module) => {
    const role = effectiveAccessRole(module, modules);
    const remote = compareRemote(module, manifests[module.mfUrl]);
    return {
      ...module,
      accessRoleInherited: !module.accessRole && !!role,
      children: modules.filter(
        ({ parentModuleId }) => parentModuleId === module.id,
      ),
      effectiveAccessRole: role,
      issues: moduleIssues(role, remote),
      parent: module.parentModuleId
        ? modules.find(({ id }) => id === module.parentModuleId)
        : undefined,
      remote,
    };
  });

export type StatusFilter = "all" | "enabled" | "disabled" | "attention";

export const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "enabled",
  "disabled",
  "attention",
];

export const isStatusFilter = (value: unknown): value is StatusFilter =>
  STATUS_FILTERS.includes(value as StatusFilter);

export const matchesStatus = (module: ModuleView, filter: StatusFilter) =>
  filter === "all" ||
  (filter === "enabled" && module.enabled) ||
  (filter === "disabled" && !module.enabled) ||
  (filter === "attention" && module.issues.length > 0);

export const matchesSearch = (module: ModuleView, search: string) => {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return [
    module.title,
    module.name,
    module.mfScope,
    module.path,
    module.location,
    module.effectiveAccessRole,
  ].some((value) => value.toLowerCase().includes(term));
};

/** Section of a module in the portal menu; child modules use their parent's. */
export const sectionOf = (module: ModuleView) =>
  splitLocation(module.parent?.location ?? module.location)[0];

/** Menu order: by section, then label; a child module follows its parent. */
const menuKey = (module: ModuleView) => {
  const anchor = module.parent ?? module;
  const [section, label] = splitLocation(anchor.location);
  return `${section}\u0000${label}\u0000${anchor.id}\u0000${module.parent ? module.title : ""}`;
};

export const sortByMenu = (modules: readonly ModuleView[]) =>
  [...modules].sort((left, right) =>
    menuKey(left).localeCompare(menuKey(right)),
  );

export interface ModuleGroup {
  /** The menu section, or "" for modules outside the menu. */
  section: string;
  modules: ModuleView[];
}

/** Modules by menu section, in menu order. */
export const groupBySection = (
  modules: readonly ModuleView[],
): ModuleGroup[] => {
  const groups = new Map<string, ModuleGroup>();
  for (const module of sortByMenu(modules)) {
    const section = sectionOf(module);
    const group = groups.get(section) ?? { modules: [], section };
    group.modules.push(module);
    groups.set(section, group);
  }
  return [...groups.values()];
};

/** Modules matching the filter text and status, grouped in menu order. */
export const listModules = (
  views: readonly ModuleView[],
  filter: string,
  status: StatusFilter,
) =>
  groupBySection(
    views.filter(
      (module) =>
        matchesSearch(module, filter) && matchesStatus(module, status),
    ),
  );

export interface ModuleCounts {
  total: number;
  enabled: number;
  disabled: number;
  attention: number;
  sections: number;
}

export const moduleCounts = (modules: readonly ModuleView[]): ModuleCounts => ({
  attention: modules.filter(({ issues }) => issues.length > 0).length,
  disabled: modules.filter(({ enabled }) => !enabled).length,
  enabled: modules.filter(({ enabled }) => enabled).length,
  sections: menuSections(modules).length,
  total: modules.length,
});

export const plural = (count: number, noun: string) =>
  `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600_000],
  ["month", 30 * 24 * 3600_000],
  ["week", 7 * 24 * 3600_000],
  ["day", 24 * 3600_000],
  ["hour", 3600_000],
  ["minute", 60_000],
];

export const relativeTime = (timestamp: number, now = Date.now()) => {
  const elapsed = timestamp - now;
  for (const [unit, size] of UNITS) {
    if (Math.abs(elapsed) >= size) {
      return RELATIVE.format(Math.round(elapsed / size), unit);
    }
  }
  return "just now";
};

export const formatDate = (timestamp: number) =>
  timestamp
    ? new Date(timestamp).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "–";
