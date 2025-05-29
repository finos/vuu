import { LayoutJSON } from "@vuu-ui/vuu-utils";

export interface WithId {
  id: string;
}

export interface LayoutMetadata extends WithId {
  name: string;
  group: string;
  screenshot: string;
  user: string;
  created: string;
}

export interface SystemLayoutMetadata extends LayoutMetadata {
  layoutJSON: LayoutJSON;
}

export type LayoutMetadataDto = Omit<LayoutMetadata, "id" | "created">;

export interface Layout extends WithId {
  json: LayoutJSON;
}

export type ApplicationLayout = {
  username: string;
  definition: LayoutJSON;
};
