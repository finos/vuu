import { IconButton, List, ListItem } from "@finos/vuu-ui-controls";
import { LayoutMetadata } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useCallback, useMemo } from "react";
import { LayoutTile } from "./LayoutTile";
import { useWorkspace } from "./WorkspaceProvider";

import layoutListCss from "./LayoutList.css";

type LayoutGroups = {
  [groupName: string]: LayoutMetadata[];
};

const classBase = "vuuLayoutList";

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

  const handleLoadLayout = useCallback(
    (layoutId?: string) => {
      if (layoutId) {
        loadLayoutById(layoutId);
      }
    },
    [loadLayoutById]
  );

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

  const content = useMemo<JSX.Element[]>(() => {
    return Object.entries(layoutsByGroup).map(
      ([heading, layoutMetadata], index) => (
        <div className={`${classBase}-group`} key={index}>
          <div className={`${classBase}-groupHeader`}>{heading}</div>
          <List<LayoutMetadata, "none">
            height={undefined}
            itemHeight={68}
            selectionStrategy="none"
            source={layoutMetadata}
            ListItem={({ item, ...props }) => (
              <ListItem {...props}>
                <LayoutTile
                  {...htmlAttributes}
                  key={item?.id}
                  metadata={item as LayoutMetadata}
                  onLoadLayout={handleLoadLayout}
                />
                <IconButton
                  className={`${classBase}-menu`}
                  data-embedded
                  icon="more-vert"
                  variant="secondary"
                />
              </ListItem>
            )}
          />
        </div>
      )
    );
  }, [handleLoadLayout, htmlAttributes, layoutsByGroup]);

  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
