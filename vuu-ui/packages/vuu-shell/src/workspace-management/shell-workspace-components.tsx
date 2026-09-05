import type {
  GridComponentSettingsCodec,
  JsonValue,
} from "@heswell/grid-layout";
import { featureFromJson, type DynamicFeatureProps } from "@vuu-ui/vuu-utils";
import { Feature } from "../feature";
import type { WorkspaceComponentRegistration } from "./workspace-component-registry";

const isRecord = (
  value: JsonValue,
): value is Readonly<Record<string, JsonValue>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const dynamicFeatureCodec: GridComponentSettingsCodec<DynamicFeatureProps> = {
  decode: (value) =>
    isRecord(value) &&
    typeof value.mfComponent === "string" &&
    typeof value.mfScope === "string" &&
    typeof value.mfUrl === "string"
      ? { ok: true, value: value as unknown as DynamicFeatureProps }
      : {
          error: {
            code: "INVALID_DYNAMIC_FEATURE",
            message:
              "dynamic feature settings require mfComponent, mfScope and mfUrl",
            path: "$",
          },
          ok: false,
        },
  encode: (value) => ({ ok: true, value }),
  isSettings: (value): value is DynamicFeatureProps =>
    typeof value === "object" &&
    value !== null &&
    "mfComponent" in value &&
    "mfScope" in value &&
    "mfUrl" in value &&
    typeof value.mfComponent === "string" &&
    typeof value.mfScope === "string" &&
    typeof value.mfUrl === "string",
  version: 1,
};

interface StaticFeatureSettings {
  readonly type: string;
}

const staticFeatureCodec: GridComponentSettingsCodec<StaticFeatureSettings> = {
  decode: (value) =>
    isRecord(value) && typeof value.type === "string"
      ? { ok: true, value: { type: value.type } }
      : {
          error: {
            code: "INVALID_STATIC_FEATURE",
            message: "static feature settings require a component type",
            path: "$.type",
          },
          ok: false,
        },
  encode: (value) => ({ ok: true, value }),
  isSettings: (value): value is StaticFeatureSettings =>
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string",
  version: 1,
};

export const shellWorkspaceComponentRegistrations: readonly WorkspaceComponentRegistration<unknown>[] =
  [
    {
      codec: dynamicFeatureCodec as GridComponentSettingsCodec<unknown>,
      render: (settings) => <Feature {...(settings as DynamicFeatureProps)} />,
      type: "vuu-dynamic-feature",
    },
    {
      codec: staticFeatureCodec as GridComponentSettingsCodec<unknown>,
      render: (settings) => featureFromJson(settings as StaticFeatureSettings),
      type: "vuu-static-feature",
    },
  ];
