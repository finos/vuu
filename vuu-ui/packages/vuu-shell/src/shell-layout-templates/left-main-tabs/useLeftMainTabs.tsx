import {
  LayoutContainer,
  Flexbox,
  Stack,
  Placeholder,
} from "@finos/vuu-layout";

import { VuuShellLocation } from "@finos/vuu-utils";
import { useMemo } from "react";
import { ShellLayoutTemplateHook } from "../useShellLayout";

export const useLeftMainTabs: ShellLayoutTemplateHook = ({
  appHeader,
  htmlAttributes,
  ToolbarProps,
}) => {
  if (ToolbarProps === undefined) {
    throw Error("LeftMainTabs layout requires ToolbarProps");
  }

  return useMemo(() => {
    const flexBasis = ToolbarProps?.width ?? 48;
    return (
      <Flexbox
        {...htmlAttributes}
        style={{
          ...htmlAttributes?.style,
          flexDirection: "column",
        }}
      >
        {appHeader}
        <Flexbox style={{ flex: 1 }}>
          <div
            {...ToolbarProps}
            style={{ flexShrink: 0, flexGrow: 0, flexBasis }}
            id={VuuShellLocation.SideToolbar}
          >
            {ToolbarProps.children}
          </div>
          <Stack
            style={{ flex: 1 }}
            showTabs={false}
            id={VuuShellLocation.MultiWorkspaceContainer}
          >
            <Placeholder style={{ background: "yellow" }} />
            <Placeholder style={{ background: "green" }} />
            <LayoutContainer
              dropTarget
              id={VuuShellLocation.WorkspaceContainer}
              key="main-content"
            />
          </Stack>
        </Flexbox>
      </Flexbox>
    );
  }, [ToolbarProps, appHeader, htmlAttributes]);
};
