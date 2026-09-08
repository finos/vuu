import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  type GridComponentRenderer,
  type GridComponentSettingsCodec,
  type JsonValue,
} from "@heswell/grid-layout";

export interface WorkspaceComponentRegistration<T> {
  readonly codec: GridComponentSettingsCodec<T>;
  readonly render: GridComponentRenderer<T>;
  readonly type: string;
}

export interface WorkspaceComponentRegistries {
  readonly renderers: GridComponentRendererRegistry;
  readonly settingsCodecs: GridComponentSettingsRegistry;
}

export const createWorkspaceComponentRegistries = <T,>(
  registrations: readonly WorkspaceComponentRegistration<T>[],
): WorkspaceComponentRegistries => {
  const renderers = new GridComponentRendererRegistry();
  const settingsCodecs = new GridComponentSettingsRegistry();
  for (const registration of registrations) {
    settingsCodecs.register(registration.type, registration.codec);
    renderers.register(
      registration.type,
      registration.codec.isSettings,
      registration.render,
    );
  }
  return { renderers, settingsCodecs };
};

export const jsonValueWorkspaceComponentCodec: GridComponentSettingsCodec<JsonValue> =
  {
    decode: (value) => ({ ok: true, value }),
    encode: (value) => ({ ok: true, value }),
    isSettings: (value): value is JsonValue => {
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return true;
      }
      if (Array.isArray(value)) {
        return value.every(jsonValueWorkspaceComponentCodec.isSettings);
      }
      return (
        typeof value === "object" &&
        Object.values(value).every(jsonValueWorkspaceComponentCodec.isSettings)
      );
    },
    version: 1,
  };
