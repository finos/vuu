import { Flexbox, StackLayout } from "@vuu-ui/vuu-layout";

import { VuuShellLocation } from "@vuu-ui/vuu-utils";
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
    return (
      <Flexbox
        {...htmlAttributes}
        style={{
          ...htmlAttributes?.style,
          flexDirection: "column",
        }}
      >
        {appHeader}
        <StackLayout
          TabstripProps={{
            className: `${VuuShellLocation.MultiWorkspaceContainer}-tabs`,
          }}
          active={0}
          showTabs="left"
          style={{ flex: 1 }}
          id={VuuShellLocation.MultiWorkspaceContainer}
        />
      </Flexbox>
    );
  }, [appHeader, htmlAttributes]);
};
