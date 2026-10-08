import {
  type ManagedModule,
  type ModuleConfig,
  type ModuleConfigChanges,
  EMPTY_MODULE_CONFIG,
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
        // Vuu connections are published by each remote in its config.json,
        // these legacy contract fields are no longer managed here.
        vuuConnectionId: "",
        vuuRestUrl: "",
        vuuWebsocketUrl: "",
      };
    })
    .sort((left, right) => left.id - right.id);
};

export const toConfig = (module: ModuleConfig): ModuleConfig => {
  const config = { ...EMPTY_MODULE_CONFIG };
  for (const key of Object.keys(
    EMPTY_MODULE_CONFIG,
  ) as (keyof ModuleConfig)[]) {
    (config as Record<string, unknown>)[key] = module[key];
  }
  return config;
};

/** The fields of `draft` that differ from `original`. `name` is never included. */
export const configChanges = (
  original: ModuleConfig,
  draft: ModuleConfig,
): ModuleConfigChanges => {
  const changes: Record<string, unknown> = {};
  for (const key of Object.keys(
    EMPTY_MODULE_CONFIG,
  ) as (keyof ModuleConfig)[]) {
    if (key !== "name" && original[key] !== draft[key]) {
      changes[key] = draft[key];
    }
  }
  return changes as ModuleConfigChanges;
};

export const FIELD_LABELS: Record<keyof ModuleConfig, string> = {
  accessRole: "Access role",
  description: "Description",
  enabled: "Enabled",
  location: "Menu location",
  mfComponent: "Exposed component",
  mfScope: "Scope",
  mfUrl: "Remote URL",
  name: "Name",
  navIconUrl: "Navigation icon",
  parentModuleId: "Parent module",
  path: "Route",
  title: "Title",
  vuuConnectionId: "Connection id",
  vuuRestUrl: "Auth (REST) URL",
  vuuWebsocketUrl: "WebSocket URL",
};

/** `/Trading/Baskets` => ["Trading", "Baskets"] */
export const splitLocation = (location: string): [string, string] => {
  const [section = "", ...label] = location.replace(/^\//, "").split("/");
  return [section, label.join("/")];
};

export const joinLocation = (section: string, label: string) =>
  section || label ? `/${section.trim()}/${label.trim()}` : "";

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Suggested route for a menu location, e.g. `/trading/risk`. */
export const suggestPath = (section: string, label: string) =>
  section && label ? `/${slug(section)}/${slug(label)}` : "";

/** Suggested module name for a title, e.g. `risk-dashboard`. */
export const suggestName = (title: string) => slug(title);

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
  message: string;
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
  if (remote && remote.status !== "ok" && remote.status !== "checking") {
    issues.push({ kind: "remote", message: remote.summary });
  }
  if (!effectiveRole) {
    issues.push({
      kind: "noAccessRole",
      message: "No access role – no user can open this module",
    });
  }
  return issues;
};

/** A short name for an issue, e.g. `remote unreachable`. */
export const issueLabel = (
  issue: ModuleIssue,
  remote?: Pick<RemoteCheck, "status">,
) =>
  issue.kind === "noAccessRole"
    ? "no access role"
    : remote?.status === "unreachable"
      ? "remote unreachable"
      : "remote mismatch";

/** One line describing a module's issues, or "" when there are none. */
export const issueSummary = ({
  issues,
  remote,
}: Pick<ModuleView, "issues" | "remote">) =>
  issues.length === 0
    ? ""
    : issues.length === 1
      ? issues[0].message
      : `${issues.length} issues · ${issues.map((issue) => issueLabel(issue, remote)).join(", ")}`;

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
export type GroupBy = "none" | "section" | "status";
export type SortBy = "menu" | "title" | "updated";

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

/**
 * Menu order: by section, then label; a child module follows its parent.
 */
const menuKey = (module: ModuleView) => {
  const anchor = module.parent ?? module;
  const [section, label] = splitLocation(anchor.location);
  return `${section}\u0000${label}\u0000${anchor.id}\u0000${module.parent ? module.title : ""}`;
};

export const sortModules = (modules: readonly ModuleView[], sortBy: SortBy) =>
  [...modules].sort((left, right) => {
    switch (sortBy) {
      case "title":
        return left.title.localeCompare(right.title);
      case "updated":
        return right.updated - left.updated;
      default:
        return menuKey(left).localeCompare(menuKey(right));
    }
  });

export interface ModuleGroup {
  key: string;
  label: string;
  modules: ModuleView[];
}

export const groupModules = (
  modules: readonly ModuleView[],
  groupBy: GroupBy,
): ModuleGroup[] => {
  if (groupBy === "none") {
    return [{ key: "all", label: "", modules: [...modules] }];
  }
  const groups = new Map<string, ModuleGroup>();
  for (const module of modules) {
    const label =
      groupBy === "status"
        ? module.enabled
          ? "Enabled"
          : "Disabled"
        : sectionOf(module) || "No menu section";
    const group = groups.get(label) ?? { key: label, label, modules: [] };
    group.modules.push(module);
    groups.set(label, group);
  }
  return [...groups.values()];
};

export interface ModuleKpis {
  total: number;
  enabled: number;
  disabled: number;
  sections: number;
  issues: number;
  modulesWithIssues: number;
}

export const moduleKpis = (modules: readonly ModuleView[]): ModuleKpis => ({
  disabled: modules.filter(({ enabled }) => !enabled).length,
  enabled: modules.filter(({ enabled }) => enabled).length,
  issues: modules.reduce((count, { issues }) => count + issues.length, 0),
  modulesWithIssues: modules.filter(({ issues }) => issues.length > 0).length,
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
