import { Flexbox, StackLayout } from "@finos/vuu-layout";

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
