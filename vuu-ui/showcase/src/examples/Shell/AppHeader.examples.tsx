import { AppHeader } from "@finos/vuu-shell";

let displaySequence = 1;

export const DefaultAppHeader = () => {
  return (
    <AppHeader
      layoutId="001"
      user={{ username: "test", token: "token" }}
      onNavigate={() => console.log("onNavigate")}
    />
  );
};
DefaultAppHeader.displaySequence = displaySequence++;
