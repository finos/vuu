import { moveItem, orientationType } from "@finos/vuu-utils";
import { ListBox, Option, useIdMemo } from "@salt-ds/core";
import {
  DragDropProviderNext as DragDropProvider,
  DragSources,
  DropHandler,
} from "@finos/vuu-layout";
import cx from "clsx";
import {
  forwardRef,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { usa_states } from "./UsStates.data";

import "./SpaceMan.examples.css";
import {
  TabBar,
  TabListNext,
  TabNext,
  TabNextTrigger,
  TabsNext,
} from "@finos/vuu-ui-controls";

const usa_10_states = usa_states.slice(0, 10);
const usa_20_states = usa_states.slice(0, 20);

const DragContainer = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    id?: string;
    orientation?: orientationType;
  }
>(function DragContainer(
  { children, id: idProp, orientation = "horizontal" },
  forwardedRef,
) {
  const id = useIdMemo(idProp);
  return (
    <div
      className={cx(
        "DragContainer",
        "vuuDragContainer",
        `vuuDragContainer-${orientation}`,
      )}
      id={id}
      ref={forwardedRef}
    >
      {children}
    </div>
  );
});

const DragItem = ({
  draggable,
  index,
  label,
}: {
  draggable?: true;
  index: number;
  label: string;
}) => {
  return (
    <div
      className="DragItem vuuDraggableItem"
      data-index={index}
      draggable={draggable}
      key={label}
      style={{ background: label }}
    >
      {label}
    </div>
  );
};

const defaultItems = ["yellow", "plum", "bisque", "darkkhaki", "lime"];

const SingleDragContainerTemplate = ({
  dragSources,
  initialItems = defaultItems,
  orientation = "horizontal",
}: {
  dragSources: DragSources;
  initialItems?: string[];
  orientation?: orientationType;
}) => {
  const [items, setItems] = useState(initialItems);
  const dragContainerRef = useRef<HTMLDivElement>(null);

  const onDrop: DropHandler = ({ fromIndex, toIndex }) => {
    setItems((items) => moveItem(items, fromIndex, toIndex));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <DragDropProvider dragSources={dragSources} onDrop={onDrop}>
        <DragContainer
          id="dc1"
          ref={dragContainerRef}
          orientation={orientation}
        >
          {items.map((label, i) => (
            <DragItem draggable index={i} key={i} label={label} />
          ))}
        </DragContainer>
      </DragDropProvider>
    </div>
  );
};

export const HorizontalDrop = () => (
  <div style={{ margin: 100 }}>
    <SingleDragContainerTemplate
      dragSources={{ dc1: { dropTargets: ["dc1"] } }}
    />
  </div>
);
export const VerticalDrop = () => {
  const orientation = "vertical";
  return (
    <div style={{ margin: 100 }}>
      <SingleDragContainerTemplate
        orientation={orientation}
        dragSources={{ dc1: { dropTargets: ["dc1"], orientation } }}
      />
    </div>
  );
};

export const VerticalDropUsStates = () => {
  const orientation = "vertical";
  return (
    <SingleDragContainerTemplate
      initialItems={usa_20_states}
      orientation={orientation}
      dragSources={{ dc1: { dropTargets: ["dc1"], orientation } }}
    />
  );
};

const CrossContainerDragTemplate = ({
  dragSources,
}: {
  dragSources: DragSources;
}) => {
  const initialItems = useMemo<Record<string, string[]>>(
    () => ({
      dc1: defaultItems,
      dc2: ["gold", "coral", "bisque", "darkkhaki", "aqua"],
    }),
    [],
  );
  const [items1, setItems1] = useState(initialItems.dc1);
  const [items2, setItems2] = useState(initialItems.dc2);

  const onDrop: DropHandler = ({ fromId, toId, fromIndex, toIndex }) => {
    console.log(`drag from #${fromId} [${fromIndex}] to #${toId} [${toIndex}]`);
    if (fromId === toId) {
      if (fromId === "dc1") {
        setItems1((items) => moveItem(items, fromIndex, toIndex));
      } else {
        setItems2((items) => moveItem(items, fromIndex, toIndex));
      }
    } else if (fromId === "dc1") {
      const newItems1 = items1.slice();
      const newItems2 = items2.slice();
      const [movedItem] = newItems1.splice(fromIndex, 1);
      setItems1(newItems1);
      newItems2.splice(toIndex, 0, movedItem);
      setItems2(newItems2);
    } else {
      const newItems1 = items1.slice();
      const newItems2 = items2.slice();
      const [movedItem] = newItems2.splice(fromIndex, 1);
      setItems2(newItems2);
      newItems1.splice(toIndex, 0, movedItem);
      setItems1(newItems1);
    }
  };

  return (
    <DragDropProvider dragSources={dragSources} onDrop={onDrop}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <DragContainer id="dc1">
          {items1.map((label, i) => (
            <DragItem draggable index={i} key={i} label={label} />
          ))}
        </DragContainer>
        <DragContainer id="dc2">
          {items2.map((label, i) => (
            <DragItem draggable index={i} key={i} label={label} />
          ))}
        </DragContainer>
      </div>
    </DragDropProvider>
  );
};

export const MultiContainerLocalDrag = () => (
  <CrossContainerDragTemplate
    dragSources={{
      dc1: { dropTargets: ["dc1"] },
      dc2: { dropTargets: ["dc2"] },
    }}
  />
);

export const OneWayCrossContainerDrag = () => (
  <CrossContainerDragTemplate
    dragSources={{
      dc1: { dropTargets: ["dc1", "dc2"] },
      dc2: { dropTargets: ["dc2"] },
    }}
  />
);

export const TwoWayCrossContainerDrag = () => (
  <CrossContainerDragTemplate
    dragSources={{
      dc1: { dropTargets: ["dc1", "dc2"] },
      dc2: { dropTargets: ["dc2", "dc1"] },
    }}
  />
);

export const TabsNextDragDrop = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState(defaultItems);
  const activeTabRef = useRef<string>(tabs[activeTabIndex]);

  const handleChange = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      setActiveTabIndex(tabs.indexOf(value));
      activeTabRef.current = value;
    },
    [tabs],
  );

  const onDrop: DropHandler = ({ fromIndex, toIndex }) => {
    const newTabs = moveItem(tabs, fromIndex, toIndex);
    setTabs(newTabs);
    setActiveTabIndex(newTabs.indexOf(activeTabRef.current));
  };

  return (
    <DragDropProvider
      dragSources={{ tabs1: { dropTargets: ["tabs1"] } }}
      onDrop={onDrop}
    >
      <TabsNext onChange={handleChange} value={tabs[activeTabIndex]}>
        <TabBar divider>
          <TabListNext
            appearance="transparent"
            id="tabs1"
            className="vuuDragContainer"
          >
            {tabs.map((label, index) => (
              <TabNext
                className="vuuDraggableItem"
                data-index={index}
                draggable
                value={label}
                key={label}
              >
                <TabNextTrigger>{label}</TabNextTrigger>
              </TabNext>
            ))}
          </TabListNext>
        </TabBar>
      </TabsNext>
    </DragDropProvider>
  );
};

export const ListBoxDragDrop = () => {
  const [items, setItems] = useState(usa_10_states);

  const onDrop: DropHandler = ({ fromIndex, toIndex }) => {
    const newItems = moveItem(items, fromIndex, toIndex);
    setItems(newItems);
  };

  return (
    <DragDropProvider
      dragSources={{
        listbox1: { dropTargets: ["listbox1"], orientation: "vertical" },
      }}
      onDrop={onDrop}
    >
      <ListBox
        className="vuuDragContainer vuuDragContainer-vertical"
        id="listbox1"
        bordered
        style={{ width: 200 }}
      >
        {items.map((state, i) => (
          <Option
            className="vuuDraggableItem"
            data-index={i}
            draggable
            key={state}
            value={state}
          />
        ))}
      </ListBox>
    </DragDropProvider>
  );
};

export const ScrollingListBoxDragDrop = () => {
  const [items, setItems] = useState(usa_20_states);

  const onDrop: DropHandler = ({ fromIndex, toIndex }) => {
    const newItems = moveItem(items, fromIndex, toIndex);
    setItems(newItems);
  };

  return (
    <DragDropProvider
      dragSources={{
        listbox1: { dropTargets: ["listbox1"], orientation: "vertical" },
      }}
      onDrop={onDrop}
    >
      <div style={{ maxHeight: 400 }}>
        <ListBox
          className="vuuDragContainer vuuDragContainer-vertical"
          id="listbox1"
          bordered
          style={{ margin: 20, width: 200 }}
        >
          {items.map((state, i) => (
            <Option
              className="vuuDraggableItem"
              data-index={i}
              draggable
              key={state}
              value={state}
            />
          ))}
        </ListBox>
      </div>
    </DragDropProvider>
  );
};
