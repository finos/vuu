import { computeMenuPosition, DropMenu, DropTarget } from "@finos/vuu-layout";
import { PopupService } from "@finos/vuu-popups";
import { useEffect, useRef } from "react";

export default {
  title: "Layout/DropMenu",
  component: DropMenu,
};

const clientRect = {
  height: 400,
  top: 200,
  right: 600,
  bottom: 600,
  left: 300,
  width: 300,
};

const dropTarget2 = new DropTarget({
  component: { type: "Stack" },
  pos: { position: { East: true } },
  clientRect,
  nextDropTarget: null,
});

const dropTarget1 = new DropTarget({
  component: { type: "View" },
  pos: { x: 400, y: 210, position: { North: true } },
  clientRect,
  nextDropTarget: dropTarget2,
}).activate();

export const DropMenuTwoOptionsNorth = () => {
  const rootRef = useRef<HTMLDivElement>();
  const onHover = (target: any) => {
    console.log(`hover`, target);
  };

  const [left, top, orientation] = computeMenuPosition(dropTarget1);
  console.log({ left, top });

  useEffect(() => {
    if (rootRef.current) {
      const { left, top } = rootRef.current.getBoundingClientRect();
      PopupService.showPopup({
        left: left + 50,
        top: top + 20,
        component: (
          <DropMenu
            dropTarget={dropTarget1}
            onHover={onHover}
            orientation={orientation}
          />
        ),
      });
    }
  }, [left, orientation, top]);

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        backgroundColor: " #eee",
        ...clientRect,
      }}
    />
  );
};
