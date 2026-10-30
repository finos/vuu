import type { GridSettingsCodecResult, JsonValue } from "@heswell/grid-layout";
import { jsonValueWorkspaceComponentCodec } from "../workspace/workspace-component-registry";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export const isJsonValue = (value: unknown): value is JsonValue =>
  jsonValueWorkspaceComponentCodec.isSettings(value);

export const invalidSettings = <T>(
  path: string,
  message: string,
): GridSettingsCodecResult<T> => ({
  error: { code: "INVALID_SETTINGS", message, path },
  ok: false,
});
