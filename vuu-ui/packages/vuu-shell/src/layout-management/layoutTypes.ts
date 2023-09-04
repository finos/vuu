import { LayoutJSON } from "@finos/vuu-layout";

export type LayoutMetadata = {
  name: string;
  group: string;
  screenshot: string;
  user: string;
  date: string;
  id: string;
};

export type Layout = {
  json: LayoutJSON;
  metadata: LayoutMetadata;
};
