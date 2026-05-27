import { EditSessionMode, InlineEditSessionMode } from "@vuu-ui/vuu-data-types";

export const isInlineEditingSession = (
  editSessionMode: EditSessionMode,
): editSessionMode is InlineEditSessionMode =>
  editSessionMode === "inline-all-rows";
