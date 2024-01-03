import type { VuuTable } from "@finos/vuu-protocol-types";
import type { ViewProps } from "@finos/vuu-layout";

declare global {
  const vuuConfig: Promise<VuuConfig>;
}

export type SaveLocation = "local" | "remote";

export interface FeatureConfig {
  name: string;
  title: string;
  url: string;
  css?: string;
  leftNavLocation: "vuu-features" | "vuu-tables";
  featureProps?: {
    schema?: "*" | VuuTable;
    schemas?: VuuTable[];
    ViewProps?: Partial<ViewProps>;
  };
}

export type Features = {
  [key: string]: FeatureConfig;
};
export interface VuuConfig {
  features: Features;
  authUrl?: string;
  websocketUrl: string;
}

export const isWildcardSchema = (schema?: "*" | VuuTable): schema is "*" =>
  schema === "*";
export const isTableSchema = (schema?: "*" | VuuTable): schema is VuuTable =>
  typeof schema === "object" &&
  typeof schema.module === "string" &&
  typeof schema.table === "string";
