import { RemoteModule } from "@vuu-ui/core/portal";
import { registerComponent } from "@vuu-ui/vuu-utils";

/** @deprecated Use RemoteModule from @vuu-ui/core/portal. */
export const Feature = RemoteModule;
Feature.displayName = "Feature";
registerComponent("Feature", Feature, "view");
