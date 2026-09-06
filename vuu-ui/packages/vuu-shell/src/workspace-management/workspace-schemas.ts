import {
  GRID_LAYOUT_DOCUMENT_VERSION,
  GridComponentSettingsRegistry,
  decodeGridLayoutDocument,
  toJsonValue,
  type GridLayoutDocument,
  type JsonValue,
} from "@heswell/grid-layout";

export const WORKSPACE_SNAPSHOT_VERSION = 1;
export const APPLICATION_SESSION_VERSION = 1;
export const NAMED_WORKSPACE_DEFINITION_VERSION = 1;
export const WORKSPACE_SNAPSHOT_RECORD_VERSION = 1;

export interface ComponentPersistentStateV1 {
  readonly componentType: string;
  readonly schemaVersion: number;
  readonly value: JsonValue;
}

export interface WorkspaceSnapshotV1 {
  readonly version: typeof WORKSPACE_SNAPSHOT_VERSION;
  readonly layout: GridLayoutDocument;
  readonly componentState: Readonly<Record<string, ComponentPersistentStateV1>>;
}

export interface OpenWorkspaceInstanceV1 {
  readonly instanceId: string;
  readonly definitionId?: string;
  readonly title?: string;
  readonly snapshotId: string;
}

export interface ApplicationSessionV1 {
  readonly version: typeof APPLICATION_SESSION_VERSION;
  readonly openWorkspaces: readonly OpenWorkspaceInstanceV1[];
  readonly workspaceOrder: readonly string[];
  readonly activeWorkspaceInstanceId: string | null;
  readonly settings: Readonly<Record<string, JsonValue>>;
}

export interface NamedWorkspaceDefinitionV1 {
  readonly version: typeof NAMED_WORKSPACE_DEFINITION_VERSION;
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly snapshot: WorkspaceSnapshotV1;
}

export interface NamedWorkspaceMetadataV1 {
  readonly version: typeof NAMED_WORKSPACE_DEFINITION_VERSION;
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceSnapshotRecordV1 {
  readonly version: typeof WORKSPACE_SNAPSHOT_RECORD_VERSION;
  readonly workspaceInstanceId: string;
  readonly revision: number;
  readonly snapshot: WorkspaceSnapshotV1;
}

export type WorkspaceSchemaName =
  | "WorkspaceSnapshotV1"
  | "ApplicationSessionV1"
  | "NamedWorkspaceDefinitionV1"
  | "NamedWorkspaceMetadataV1"
  | "WorkspaceSnapshotRecordV1";

export interface WorkspaceValidationIssue {
  readonly code:
    | "INVALID_JSON_VALUE"
    | "INVALID_VALUE"
    | "UNEXPECTED_FIELD"
    | "UNSUPPORTED_VERSION";
  readonly message: string;
  readonly path: string;
}

export class WorkspaceValidationError extends Error {
  constructor(
    readonly schema: WorkspaceSchemaName,
    readonly issues: readonly WorkspaceValidationIssue[],
  ) {
    super(
      `${schema} validation failed: ${issues[0]?.path ?? "$"}: ${issues[0]?.message ?? "invalid value"}`,
    );
    this.name = "WorkspaceValidationError";
  }
}

type MutableIssues = WorkspaceValidationIssue[];
type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const issue = (
  issues: MutableIssues,
  code: WorkspaceValidationIssue["code"],
  path: string,
  message: string,
) => {
  issues.push({ code, message, path });
};

const fields = (
  value: JsonRecord,
  allowed: readonly string[],
  path: string,
  issues: MutableIssues,
) => {
  for (const field of Object.keys(value)) {
    if (!allowed.includes(field)) {
      issue(
        issues,
        "UNEXPECTED_FIELD",
        `${path}.${field}`,
        `unexpected field "${field}"`,
      );
    }
  }
};

const stringField = (
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is string => {
  if (typeof value !== "string" || value.length === 0) {
    issue(issues, "INVALID_VALUE", path, "must be a non-empty string");
    return false;
  }
  return true;
};

const version = (
  value: unknown,
  expected: number,
  path: string,
  issues: MutableIssues,
) => {
  if (value !== expected) {
    issue(
      issues,
      "UNSUPPORTED_VERSION",
      path,
      `expected version ${expected}, received ${String(value)}`,
    );
  }
};

const validateGridLayout = (
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is GridLayoutDocument => {
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", path, "must be a grid layout document");
    return false;
  }
  if (value.version !== GRID_LAYOUT_DOCUMENT_VERSION) {
    issue(
      issues,
      "UNSUPPORTED_VERSION",
      `${path}.version`,
      `expected grid layout version ${GRID_LAYOUT_DOCUMENT_VERSION}, received ${String(value.version)}`,
    );
    return false;
  }

  const registry = new GridComponentSettingsRegistry();
  if (Array.isArray(value.components)) {
    const versions = new Map<string, number>();
    for (const component of value.components) {
      if (
        isRecord(component) &&
        typeof component.type === "string" &&
        component.type.length > 0 &&
        typeof component.version === "number" &&
        Number.isInteger(component.version) &&
        component.version >= 1
      ) {
        const previous = versions.get(component.type);
        if (previous !== undefined && previous !== component.version) {
          issue(
            issues,
            "INVALID_VALUE",
            `${path}.components`,
            `component type "${component.type}" uses multiple schema versions`,
          );
          return false;
        }
        versions.set(component.type, component.version);
      }
    }
    for (const [type, componentVersion] of versions) {
      registry.register(type, {
        decode: (settings) => ({ ok: true, value: settings }),
        encode: (settings) => ({ ok: true, value: settings }),
        isSettings: (settings): settings is JsonValue =>
          toJsonValue(settings).ok,
        version: componentVersion,
      });
    }
  }

  const decoded = decodeGridLayoutDocument(value, registry);
  if (!decoded.ok) {
    issue(
      issues,
      "INVALID_VALUE",
      `${path}${decoded.error.path.slice(1)}`,
      decoded.error.message,
    );
    return false;
  }
  return true;
};

const validateComponentState = (
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is Readonly<Record<string, ComponentPersistentStateV1>> => {
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", path, "must be an object");
    return false;
  }
  for (const [id, entry] of Object.entries(value)) {
    const entryPath = `${path}.${id}`;
    if (!id) {
      issue(
        issues,
        "INVALID_VALUE",
        entryPath,
        "component id must not be empty",
      );
    }
    if (!isRecord(entry)) {
      issue(issues, "INVALID_VALUE", entryPath, "must be an object");
      continue;
    }
    fields(
      entry,
      ["componentType", "schemaVersion", "value"],
      entryPath,
      issues,
    );
    stringField(entry.componentType, `${entryPath}.componentType`, issues);
    if (
      typeof entry.schemaVersion !== "number" ||
      !Number.isInteger(entry.schemaVersion) ||
      entry.schemaVersion < 1
    ) {
      issue(
        issues,
        "INVALID_VALUE",
        `${entryPath}.schemaVersion`,
        "must be a positive integer",
      );
    }
    const json = toJsonValue(entry.value, `${entryPath}.value`);
    if (!json.ok) {
      issue(issues, "INVALID_JSON_VALUE", json.error.path, json.error.message);
    }
  }
  return true;
};

const result = <T>(
  schema: WorkspaceSchemaName,
  value: unknown,
  issues: MutableIssues,
): T => {
  if (issues.length > 0) {
    throw new WorkspaceValidationError(schema, issues);
  }
  return value as T;
};

export const validateWorkspaceSnapshotV1 = (
  value: unknown,
): WorkspaceSnapshotV1 => {
  const issues: MutableIssues = [];
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", "$", "must be an object");
    return result("WorkspaceSnapshotV1", value, issues);
  }
  fields(value, ["version", "layout", "componentState"], "$", issues);
  version(value.version, WORKSPACE_SNAPSHOT_VERSION, "$.version", issues);
  validateGridLayout(value.layout, "$.layout", issues);
  validateComponentState(value.componentState, "$.componentState", issues);
  return result("WorkspaceSnapshotV1", value, issues);
};

const validateSettings = (
  value: unknown,
  path: string,
  issues: MutableIssues,
) => {
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", path, "must be an object");
    return;
  }
  for (const [key, setting] of Object.entries(value)) {
    const json = toJsonValue(setting, `${path}.${key}`);
    if (!json.ok) {
      issue(issues, "INVALID_JSON_VALUE", json.error.path, json.error.message);
    }
  }
};

export const validateApplicationSessionV1 = (
  value: unknown,
): ApplicationSessionV1 => {
  const issues: MutableIssues = [];
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", "$", "must be an object");
    return result("ApplicationSessionV1", value, issues);
  }
  fields(
    value,
    [
      "version",
      "openWorkspaces",
      "workspaceOrder",
      "activeWorkspaceInstanceId",
      "settings",
    ],
    "$",
    issues,
  );
  version(value.version, APPLICATION_SESSION_VERSION, "$.version", issues);
  const ids = new Set<string>();
  if (!Array.isArray(value.openWorkspaces)) {
    issue(issues, "INVALID_VALUE", "$.openWorkspaces", "must be an array");
  } else {
    value.openWorkspaces.forEach((entry, index) => {
      const path = `$.openWorkspaces[${index}]`;
      if (!isRecord(entry)) {
        issue(issues, "INVALID_VALUE", path, "must be an object");
        return;
      }
      fields(
        entry,
        ["instanceId", "definitionId", "title", "snapshotId"],
        path,
        issues,
      );
      if (stringField(entry.instanceId, `${path}.instanceId`, issues)) {
        if (ids.has(entry.instanceId)) {
          issue(
            issues,
            "INVALID_VALUE",
            `${path}.instanceId`,
            "must be unique",
          );
        }
        ids.add(entry.instanceId);
      }
      stringField(entry.snapshotId, `${path}.snapshotId`, issues);
      if (entry.definitionId !== undefined) {
        stringField(entry.definitionId, `${path}.definitionId`, issues);
      }
      if (entry.title !== undefined) {
        stringField(entry.title, `${path}.title`, issues);
      }
    });
  }
  if (
    !Array.isArray(value.workspaceOrder) ||
    value.workspaceOrder.some((id) => typeof id !== "string") ||
    value.workspaceOrder.length !== ids.size ||
    new Set(value.workspaceOrder).size !== ids.size ||
    value.workspaceOrder.some((id) => !ids.has(id))
  ) {
    issue(
      issues,
      "INVALID_VALUE",
      "$.workspaceOrder",
      "must contain every open workspace instance id exactly once",
    );
  }
  if (
    value.activeWorkspaceInstanceId !== null &&
    (typeof value.activeWorkspaceInstanceId !== "string" ||
      !ids.has(value.activeWorkspaceInstanceId))
  ) {
    issue(
      issues,
      "INVALID_VALUE",
      "$.activeWorkspaceInstanceId",
      "must be null or identify an open workspace",
    );
  }
  validateSettings(value.settings, "$.settings", issues);
  return result("ApplicationSessionV1", value, issues);
};

const validateMetadata = (
  value: JsonRecord,
  issues: MutableIssues,
  includeSnapshot: boolean,
) => {
  fields(
    value,
    [
      "version",
      "id",
      "name",
      "description",
      "createdAt",
      "updatedAt",
      ...(includeSnapshot ? ["snapshot"] : []),
    ],
    "$",
    issues,
  );
  version(
    value.version,
    NAMED_WORKSPACE_DEFINITION_VERSION,
    "$.version",
    issues,
  );
  stringField(value.id, "$.id", issues);
  stringField(value.name, "$.name", issues);
  stringField(value.createdAt, "$.createdAt", issues);
  stringField(value.updatedAt, "$.updatedAt", issues);
  if (
    value.description !== undefined &&
    typeof value.description !== "string"
  ) {
    issue(issues, "INVALID_VALUE", "$.description", "must be a string");
  }
};

export const validateNamedWorkspaceDefinitionV1 = (
  value: unknown,
): NamedWorkspaceDefinitionV1 => {
  const issues: MutableIssues = [];
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", "$", "must be an object");
    return result("NamedWorkspaceDefinitionV1", value, issues);
  }
  validateMetadata(value, issues, true);
  try {
    validateWorkspaceSnapshotV1(value.snapshot);
  } catch (error) {
    if (!(error instanceof WorkspaceValidationError)) {
      throw error;
    }
    for (const nested of error.issues) {
      issues.push({ ...nested, path: `$.snapshot${nested.path.slice(1)}` });
    }
  }
  return result("NamedWorkspaceDefinitionV1", value, issues);
};

export const validateNamedWorkspaceMetadataV1 = (
  value: unknown,
): NamedWorkspaceMetadataV1 => {
  const issues: MutableIssues = [];
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", "$", "must be an object");
    return result("NamedWorkspaceMetadataV1", value, issues);
  }
  validateMetadata(value, issues, false);
  return result("NamedWorkspaceMetadataV1", value, issues);
};

export const validateWorkspaceSnapshotRecordV1 = (
  value: unknown,
): WorkspaceSnapshotRecordV1 => {
  const issues: MutableIssues = [];
  if (!isRecord(value)) {
    issue(issues, "INVALID_VALUE", "$", "must be an object");
    return result("WorkspaceSnapshotRecordV1", value, issues);
  }
  fields(
    value,
    ["version", "workspaceInstanceId", "revision", "snapshot"],
    "$",
    issues,
  );
  version(
    value.version,
    WORKSPACE_SNAPSHOT_RECORD_VERSION,
    "$.version",
    issues,
  );
  stringField(value.workspaceInstanceId, "$.workspaceInstanceId", issues);
  if (
    typeof value.revision !== "number" ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1
  ) {
    issue(issues, "INVALID_VALUE", "$.revision", "must be a positive integer");
  }
  try {
    validateWorkspaceSnapshotV1(value.snapshot);
  } catch (error) {
    if (!(error instanceof WorkspaceValidationError)) {
      throw error;
    }
    for (const nested of error.issues) {
      issues.push({ ...nested, path: `$.snapshot${nested.path.slice(1)}` });
    }
  }
  return result("WorkspaceSnapshotRecordV1", value, issues);
};

export const workspaceMetadata = (
  definition: NamedWorkspaceDefinitionV1,
): NamedWorkspaceMetadataV1 => ({
  version: NAMED_WORKSPACE_DEFINITION_VERSION,
  id: definition.id,
  name: definition.name,
  ...(definition.description === undefined
    ? {}
    : { description: definition.description }),
  createdAt: definition.createdAt,
  updatedAt: definition.updatedAt,
});

export const cloneWorkspaceValue = <T>(value: T): T => {
  const json = toJsonValue(value);
  if (!json.ok) {
    throw new WorkspaceValidationError("WorkspaceSnapshotV1", [
      {
        code: "INVALID_JSON_VALUE",
        message: json.error.message,
        path: json.error.path,
      },
    ]);
  }
  return JSON.parse(JSON.stringify(json.value)) as T;
};
