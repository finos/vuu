import { HTMLAttributes } from "react";
import { List } from "@finos/vuu-ui-controls";
import { LayoutMetadata } from "./layoutTypes";
import { useLayoutManager } from "./useLayoutManager";
import { LayoutTile } from "./LayoutTile";

import "./LayoutList.css";

type LayoutGroups = {
  [groupName: string]: LayoutMetadata[];
};

const classBase = "vuuLayoutList";

export const LayoutList = (props: HTMLAttributes<HTMLDivElement>) => {
  const { layoutMetadata, loadLayoutById } = useLayoutManager();

  const handleLoadLayout = (layoutId?: string) => {
    if (layoutId) {
      loadLayoutById(layoutId);
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

  return (
    <div
      className={classBase}
      {...props}
      role="listbox"
      aria-label="my layouts"
    >
      <div className={`${classBase}-header`}>My Layouts</div>
      <List<[string, LayoutMetadata[]]>
        height="auto"
        source={Object.entries(layoutsByGroup)}
        ListItem={({ item }) => {
          if (!item) return <></>;
          const [groupName, layoutMetadata] = item;
          return (
            <div role="list" aria-label={groupName}>
              <div className={`${classBase}-groupName`}>{groupName}</div>
              {layoutMetadata.map((metadata) => (
                <LayoutTile
                  key={metadata.id}
                  metadata={metadata}
                  handleLoadLayout={handleLoadLayout}
                />
              ))}
            </div>
          );
        }}
      />
    </div>
  );
};
