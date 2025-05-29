import { LoginPanel } from "@vuu-ui/vuu-shell";

export const DefaultLoginPanel = () => {
  return <LoginPanel onSubmit={() => console.log("onSubmit")} />;
};
