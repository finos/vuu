import { hasUrlParameter } from "@finos/vuu-utils";
if (hasUrlParameter("standalone")) {
  import("./index-standalone");
} else {
  import("./index-main");
}
