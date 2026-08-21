import { RemoteModule } from "@vuu-ui/core";
import { registerComponent } from "@vuu-ui/vuu-utils";

/** @deprecated Use RemoteModule from @vuu-ui/core. */
export const Feature = RemoteModule;
Feature.displayName = "Feature";
registerComponent("Feature", Feature, "view");
