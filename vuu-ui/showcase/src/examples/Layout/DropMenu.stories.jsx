import React from "react";

import { PopupService } from "@vuu-ui/ui-controls";
import { DropMenu, computeMenuPosition, DropTarget } from "@vuu-ui/vuu-layout";

export default {
  title: "Layout/DropMenu",
  component: DropMenu,
};

export const DropMenuTwoOptionsNorth = () => {
  const onHover = (target) => {
    console.log(`hover`, target);
  };

  const clientRect = { top: 200, right: 200, bottom: 400, left: 300 };

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

  const [left, top, orientation] = computeMenuPosition(dropTarget1);

  PopupService.showPopup({
    left,
    top,
    component: (
      <DropMenu
        dropTarget={dropTarget1}
        onHover={onHover}
        orientation={orientation}
      />
    ),
  });

  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: " #eee",
        ...clientRect,
      }}
    />
  );
};
