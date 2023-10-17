import { LayoutJSON } from "@finos/vuu-layout";

export interface WithId {
  id: string
}

export interface LayoutMetadata extends WithId {
  name: string;
  group: string;
  screenshot: string;
  user: string;
  date: string;
}

export interface Layout extends WithId {
  json: LayoutJSON;
}
