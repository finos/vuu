import { LayoutContainer, Flexbox } from "@finos/vuu-layout";
import { VuuShellLocation } from "@finos/vuu-utils";
import { ContextPanel } from "../context-panel";
import { ShellLayoutTemplateHook } from "../useShellLayout";

export const useSimpleContentPane: ShellLayoutTemplateHook = ({
  appHeader,
  htmlAttributes,
}) => {
  return (
    <Flexbox
      {...htmlAttributes}
      style={{
        ...htmlAttributes?.style,
        flexDirection: "row",
      }}
    >
      <Flexbox
        className="vuuShell-content"
        style={{ flex: 1, flexDirection: "column" }}
      >
        {appHeader}
        <LayoutContainer
          id={VuuShellLocation.WorkspaceContainer}
          key="main-content"
          style={{ flex: 1 }}
        />
      </Flexbox>
      <ContextPanel id={VuuShellLocation.ContextPanel} overlay></ContextPanel>
    </Flexbox>
  );
};
