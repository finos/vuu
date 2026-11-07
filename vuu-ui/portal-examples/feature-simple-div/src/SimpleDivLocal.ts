import { ensureVuuModule, simulModule } from "@vuu-ui/vuu-data-test";
import SimpleDiv from "./SimpleDiv";

ensureVuuModule(simulModule);

export { stateMigrations } from "./SavedStateDemo";
export default SimpleDiv;
