import type { StartHereEntry } from "./home-model";

/** Curated cards for the Start here section of the home page */
export const START_HERE: StartHereEntry[] = [
  { kind: "guide", path: "/Docs/Table" },
  { kind: "theme" },
];

/** Number of areas shown before 'All areas' is selected */
export const FEATURED_AREA_COUNT = 8;

export type AreaArtVariant =
  | "controls"
  | "date"
  | "extras"
  | "filters"
  | "generic"
  | "layout"
  | "salt"
  | "shell"
  | "table";

const AREA_ART: Record<string, AreaArtVariant> = {
  AppPatterns: "shell",
  Apps: "shell",
  DataEditing: "table",
  DataTable: "table",
  DateTime: "date",
  Filters: "filters",
  GridLayout: "layout",
  Layout: "layout",
  Shell: "shell",
  Table: "table",
  TableExtras: "extras",
  UiControls: "controls",
  salt: "salt",
};

export const areaArtVariant = (areaId: string): AreaArtVariant =>
  AREA_ART[areaId] ?? "generic";
