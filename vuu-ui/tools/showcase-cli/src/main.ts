import { hasUrlParameter } from "@finos/vuu-utils";
import { ExhibitsJson } from "./exhibit-utils";

export default async (exhibits: ExhibitsJson) => {
  console.log("Showcase start", {
    exhibits,
  });
  if (hasUrlParameter("standalone")) {
    const { default: start } = await import("./index-standalone");
    start(exhibits);
  } else {
    const { default: start } = await import("./index-main");
    start(exhibits);
  }
};
