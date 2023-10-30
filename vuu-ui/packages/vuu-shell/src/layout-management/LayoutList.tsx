import { HTMLAttributes } from "react";
import { List } from "@finos/vuu-ui-controls";
import { LayoutMetadata } from "./layoutTypes";
import { useLayoutManager } from "./useLayoutManager";

import "./LayoutList.css";

type LayoutGroups = {
  [groupName: string]: LayoutMetadata[];
};

const classBase = "vuuLayoutList";

export const LayoutsList = (props: HTMLAttributes<HTMLDivElement>) => {
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
    <div className={classBase} {...props}>
      <div className={`${classBase}-header`}>My Layouts</div>
      <List<[string, LayoutMetadata[]]>
        height="auto"
        source={Object.entries(layoutsByGroup)}
        ListItem={({ item }) => {
          if (!item) return <></>;
          const [groupName, layoutMetadata] = item;
          return (
            <>
              <div className={`${classBase}-groupName`}>{groupName}</div>
              {layoutMetadata.map((metadata) => (
                <div
                  className={`${classBase}-layoutContainer`}
                                key={metadata?.id}
                                onClick={() => handleLoadLayout(metadata?.id)}
                >
                  <img
                    className={`${classBase}-screenshot`}
                    src={metadata?.screenshot}
                  />
                  <div>
                    <div className={`${classBase}-layoutName`}>
                      {metadata?.name}
                    </div>
                    <div className={`${classBase}-layoutDetails`}>
                                        <div>{`${metadata?.user}, ${metadata?.date}`}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          );
        }}
      />
    </div>
  );
};
