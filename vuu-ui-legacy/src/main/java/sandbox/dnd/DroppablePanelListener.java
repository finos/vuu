package sandbox.dnd;

import java.awt.dnd.DropTargetDragEvent;

public interface DroppablePanelListener {
    void onDrop(String dropInfo, DroppablePanel.PanelPosition position);
    void onPanelOver(DropTargetDragEvent dtde);
    void onPanelEnter(DropTargetDragEvent dtde);
}
