import { Button } from "@salt-ds/core";
import { HoverOverlay, HoverOverlayProps } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useState } from "react";

const HoverOverlayTemplate = ({
  openOn,
  placement,
}: Pick<HoverOverlayProps, "openOn" | "placement">) => {
  const [openChanges, setOpenChanges] = useState<string[]>([]);

  const handleOpenChange = useCallback((open: boolean) => {
    setOpenChanges((changes) => changes.concat(open ? "open" : "close"));
  }, []);

  return (
    <div
      data-showcase-center
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <HoverOverlay
        onOpenChange={handleOpenChange}
        openOn={openOn}
        placement={placement}
        trigger={<Button data-testid="hover-overlay-trigger">Trigger</Button>}
      >
        <div data-testid="hover-overlay-content" style={{ padding: 8 }}>
          <div>Overlay content</div>
          <Button>Action</Button>
        </div>
      </HoverOverlay>
      <div data-testid="open-change-log">{openChanges.join(",")}</div>
    </div>
  );
};

export const DefaultHoverOverlay = () => <HoverOverlayTemplate />;

export const HoverOverlayPlacementBottom = () => (
  <HoverOverlayTemplate placement="bottom" />
);

export const ClickOverlay = () => <HoverOverlayTemplate openOn="click" />;
