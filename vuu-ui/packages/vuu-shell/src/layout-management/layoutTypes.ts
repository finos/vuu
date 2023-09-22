import { LayoutJSON } from "@finos/vuu-layout";

export type LayoutMetadata = {
  id: string;
  name: string;
  group: string;
  screenshot: string;
  user: string;
  date: string;
};

export type Layout = {
  id: string,
  json: LayoutJSON;
};
