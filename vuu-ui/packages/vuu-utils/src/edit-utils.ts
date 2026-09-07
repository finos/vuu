import type { EditSessionMode } from "@vuu-ui/vuu-data-types";

export const isInlineEditingSession = (
  editSessionMode: EditSessionMode,
): editSessionMode is "inline-all-rows" =>
  editSessionMode.startsWith("inline");
