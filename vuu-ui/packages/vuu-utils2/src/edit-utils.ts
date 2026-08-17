import type { EditSessionMode } from "@vuu-ui/vuu-data-types";

export const isInlineEditingSession = (
  mode: EditSessionMode,
): mode is "inline-all-rows" => mode === "inline-all-rows";
