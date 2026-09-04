import type { ReactElement } from "react";
import type { JsonValue, JsonValueIssue } from "./json-value";
import { toJsonValue } from "./json-value";

export interface GridSettingsCodecIssue {
  readonly code: string;
  readonly message: string;
  readonly path: string;
}

export type GridSettingsCodecResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: GridSettingsCodecIssue; readonly ok: false };

export interface GridComponentSettingsCodec<T> {
  readonly decode: (value: JsonValue) => GridSettingsCodecResult<T>;
  readonly encode: (settings: T) => GridSettingsCodecResult<unknown>;
  readonly isSettings: (value: unknown) => value is T;
  readonly migrations?: Readonly<
    Record<number, (value: JsonValue) => GridSettingsCodecResult<unknown>>
  >;
  readonly version: number;
}

export interface GridComponentSettingsInput {
  readonly id: string;
  readonly settings: unknown;
  readonly type: string;
}

export interface EncodedGridComponentSettings {
  readonly id: string;
  readonly settings: JsonValue;
  readonly type: string;
  readonly version: number;
}

export interface DecodedGridComponentSettings {
  readonly id: string;
  readonly settings: unknown;
  readonly type: string;
  readonly version: number;
}

export type GridComponentSettingsErrorCode =
  | "COMPONENT_DECODE_FAILED"
  | "COMPONENT_ENCODE_FAILED"
  | "COMPONENT_MIGRATION_FAILED"
  | "INVALID_COMPONENT_SETTINGS"
  | "UNKNOWN_COMPONENT_TYPE"
  | "UNSUPPORTED_COMPONENT_VERSION";

export interface GridComponentSettingsError {
  readonly code: GridComponentSettingsErrorCode;
  readonly componentId: string;
  readonly componentType: string;
  readonly message: string;
  readonly path: string;
  readonly version?: number;
}

export type GridComponentSettingsResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: GridComponentSettingsError; readonly ok: false };

interface RegisteredCodec {
  readonly decode: (value: JsonValue) => GridSettingsCodecResult<unknown>;
  readonly encode: (settings: unknown) => GridSettingsCodecResult<unknown>;
  readonly migrations: Readonly<
    Record<number, (value: JsonValue) => GridSettingsCodecResult<unknown>>
  >;
  readonly version: number;
}

const jsonIssue = (
  issue: JsonValueIssue,
  component: Pick<GridComponentSettingsInput, "id" | "type">,
  code:
    | "COMPONENT_ENCODE_FAILED"
    | "COMPONENT_MIGRATION_FAILED"
    | "INVALID_COMPONENT_SETTINGS",
  version?: number,
): GridComponentSettingsError => ({
  code,
  componentId: component.id,
  componentType: component.type,
  message: issue.message,
  path: issue.path,
  version,
});

const codecError = (
  issue: GridSettingsCodecIssue,
  component: Pick<GridComponentSettingsInput, "id" | "type">,
  code:
    | "COMPONENT_DECODE_FAILED"
    | "COMPONENT_ENCODE_FAILED"
    | "COMPONENT_MIGRATION_FAILED",
  version: number,
): GridComponentSettingsError => ({
  code,
  componentId: component.id,
  componentType: component.type,
  message: issue.message,
  path: issue.path,
  version,
});

export class GridComponentSettingsRegistry {
  readonly #codecs = new Map<string, RegisteredCodec>();

  register<T>(type: string, codec: GridComponentSettingsCodec<T>): void {
    if (!type) {
      throw new Error("Grid component type must not be empty");
    }
    if (!Number.isInteger(codec.version) || codec.version < 1) {
      throw new Error(`Grid component codec "${type}" has an invalid version`);
    }
    if (this.#codecs.has(type)) {
      throw new Error(`Grid component codec "${type}" is already registered`);
    }
    this.#codecs.set(type, {
      decode: codec.decode,
      encode: (settings) =>
        codec.isSettings(settings)
          ? codec.encode(settings)
          : {
              error: {
                code: "INVALID_SETTINGS_TYPE",
                message: `settings do not match component type "${type}"`,
                path: "$",
              },
              ok: false,
            },
      migrations: codec.migrations ?? {},
      version: codec.version,
    });
  }

  encode(
    component: GridComponentSettingsInput,
  ): GridComponentSettingsResult<EncodedGridComponentSettings> {
    const codec = this.#codecs.get(component.type);
    if (!codec) {
      return {
        error: {
          code: "UNKNOWN_COMPONENT_TYPE",
          componentId: component.id,
          componentType: component.type,
          message: `component type "${component.type}" is not registered`,
          path: "$.type",
        },
        ok: false,
      };
    }
    const encoded = codec.encode(component.settings);
    if (!encoded.ok) {
      return {
        error: codecError(
          encoded.error,
          component,
          "COMPONENT_ENCODE_FAILED",
          codec.version,
        ),
        ok: false,
      };
    }
    const json = toJsonValue(encoded.value, "$.settings");
    if (!json.ok) {
      return {
        error: jsonIssue(
          json.error,
          component,
          "COMPONENT_ENCODE_FAILED",
          codec.version,
        ),
        ok: false,
      };
    }
    return {
      ok: true,
      value: {
        id: component.id,
        settings: json.value,
        type: component.type,
        version: codec.version,
      },
    };
  }

  decode(
    component: EncodedGridComponentSettings,
  ): GridComponentSettingsResult<DecodedGridComponentSettings> {
    const codec = this.#codecs.get(component.type);
    if (!codec) {
      return {
        error: {
          code: "UNKNOWN_COMPONENT_TYPE",
          componentId: component.id,
          componentType: component.type,
          message: `component type "${component.type}" is not registered`,
          path: "$.type",
          version: component.version,
        },
        ok: false,
      };
    }
    if (component.version > codec.version || component.version < 1) {
      return {
        error: {
          code: "UNSUPPORTED_COMPONENT_VERSION",
          componentId: component.id,
          componentType: component.type,
          message: `component settings version ${component.version} is not supported; current version is ${codec.version}`,
          path: "$.version",
          version: component.version,
        },
        ok: false,
      };
    }

    let value = component.settings;
    for (
      let version = component.version;
      version < codec.version;
      version += 1
    ) {
      const migrate = codec.migrations[version];
      if (!migrate) {
        return {
          error: {
            code: "UNSUPPORTED_COMPONENT_VERSION",
            componentId: component.id,
            componentType: component.type,
            message: `no migration from component settings version ${version}`,
            path: "$.version",
            version,
          },
          ok: false,
        };
      }
      const migrated = migrate(value);
      if (!migrated.ok) {
        return {
          error: codecError(
            migrated.error,
            component,
            "COMPONENT_MIGRATION_FAILED",
            version,
          ),
          ok: false,
        };
      }
      const json = toJsonValue(migrated.value, "$.settings");
      if (!json.ok) {
        return {
          error: jsonIssue(
            json.error,
            component,
            "COMPONENT_MIGRATION_FAILED",
            version,
          ),
          ok: false,
        };
      }
      value = json.value;
    }

    const decoded = codec.decode(value);
    return decoded.ok
      ? {
          ok: true,
          value: {
            ...component,
            settings: decoded.value,
            version: codec.version,
          },
        }
      : {
          error: codecError(
            decoded.error,
            component,
            "COMPONENT_DECODE_FAILED",
            component.version,
          ),
          ok: false,
        };
  }
}

export type GridComponentRenderer<T> = (
  settings: T,
  componentId: string,
) => ReactElement;

interface RegisteredRenderer {
  readonly isSettings: (value: unknown) => boolean;
  readonly render: (settings: unknown, componentId: string) => ReactElement;
}

export class GridComponentRendererRegistry {
  readonly #renderers = new Map<string, RegisteredRenderer>();

  register<T>(
    type: string,
    isSettings: (value: unknown) => value is T,
    render: GridComponentRenderer<T>,
  ): void {
    if (this.#renderers.has(type)) {
      throw new Error(
        `Grid component renderer "${type}" is already registered`,
      );
    }
    this.#renderers.set(type, {
      isSettings,
      render: (settings, componentId) => {
        if (!isSettings(settings)) {
          throw new Error(`Decoded settings do not match renderer "${type}"`);
        }
        return render(settings, componentId);
      },
    });
  }

  render(component: DecodedGridComponentSettings): ReactElement {
    const renderer = this.#renderers.get(component.type);
    if (!renderer) {
      throw new Error(
        `Grid component renderer "${component.type}" is not registered`,
      );
    }
    return renderer.render(component.settings, component.id);
  }
}

export class GridLayoutContentRegistry<T> {
  #entries = new Map<string, T>();

  entries(): ReadonlyMap<string, T> {
    return new Map(this.#entries);
  }

  replace(
    components: readonly DecodedGridComponentSettings[],
    resolve: (component: DecodedGridComponentSettings) => T,
  ): void {
    const next = new Map<string, T>();
    for (const component of components) {
      next.set(component.id, resolve(component));
    }
    this.#entries = next;
  }
}
