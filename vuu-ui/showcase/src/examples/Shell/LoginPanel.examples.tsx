import { LoginPanel } from "@finos/vuu-shell";

export const DefaultLoginPanel = () => {
  return <LoginPanel onSubmit={() => console.log("onSubmit")} />;
};
