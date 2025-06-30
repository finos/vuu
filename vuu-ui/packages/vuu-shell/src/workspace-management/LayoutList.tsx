import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { ListBox, Option } from "@salt-ds/core";
import {
  LayoutJSON,
  LayoutMetadata,
  VuuShellLocation,
} from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, ReactElement, useCallback, useMemo } from "react";
import { LayoutTile } from "./LayoutTile";
import { useWorkspace } from "./WorkspaceProvider";
import { useLayouts } from "../feature-and-layout-provider";
import { layoutFromJson, useLayoutProviderDispatch } from "@vuu-ui/vuu-layout";

import layoutListCss from "./LayoutList.css";

type LayoutGroups = {
  [groupName: string]: LayoutMetadata[];
};

const classBase = "vuuLayoutList";

const NO_SELECTION: never[] = [];

export const LayoutList = ({
  className,
  title,
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement>) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-list",
    css: layoutListCss,
    window: targetWindow,
  });

  const { layoutMetadata, loadLayoutById } = useWorkspace();
  const { systemLayouts } = useLayouts();

  const handleLoadLayout = useCallback(
    (layoutId?: string) => {
      if (layoutId) {
        loadLayoutById(layoutId);
      }
    },
    [loadLayoutById],
  );

  const dispatch = useLayoutProviderDispatch();
  const handleLoadSysLayout = (layoutId?: string, layoutJSON?: LayoutJSON) => {
    if (layoutJSON) {
      dispatch({
        type: "add",
        path: `#${VuuShellLocation.Workspace}`,
        component: layoutFromJson(layoutJSON, "0"),
      });
    } else {
      throw Error("layoutJSON is required for system layouts");
    }
  };

  const layoutsByGroup = layoutMetadata.reduce((acc: LayoutGroups, cur) => {
    if (acc[cur.group]) {
      return {
        ...acc,
        [cur.group]: [...acc[cur.group], cur],
      };
    }
    return {
      ...acc,
      [cur.group]: [cur],
    };
  }, {});

  let sysContent: ReactElement[] = [];
  if (systemLayouts) {
    sysContent = [
      <div className={`${classBase}-group`} key={0}>
        <div className={`${classBase}-groupHeader`}>System Layout</div>
        <ListBox selected={NO_SELECTION}>
          {systemLayouts.map((layout) => (
            <Option value={layout} key={layout.id}>
              <LayoutTile
                {...htmlAttributes}
                key={layout.id}
                metadata={layout}
                onLoadLayout={handleLoadSysLayout}
              />
            </Option>
          ))}
        </ListBox>
      </div>,
    ];
  }

  const content = useMemo<ReactElement[]>(() => {
    return Object.entries(layoutsByGroup).map(
      ([heading, layoutMetadata], index) => (
        <div className={`${classBase}-group`} key={index}>
          <div className={`${classBase}-groupHeader`}>{heading}</div>
          <ListBox selected={NO_SELECTION}>
            {layoutMetadata.map((layout) => (
              <Option value={layout} key={layout.id}>
                <LayoutTile
                  {...htmlAttributes}
                  key={layout.id}
                  metadata={layout}
                  onLoadLayout={handleLoadLayout}
                />
                <IconButton
                  className={`${classBase}-menu`}
                  data-embedded
                  icon="more-vert"
                  appearance="transparent"
                  sentiment="neutral"
                />
              </Option>
            ))}
          </ListBox>
        </div>
      ),
    );
  }, [handleLoadLayout, htmlAttributes, layoutsByGroup]);

  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>{[sysContent, ...content]}</div>
    </div>
  );
};
