import { EventEmitter, type orientationType } from "@vuu-ui/vuu-utils";
import {
  type DragSource,
  sourceIsComponent,
  sourceIsTabbedComponent,
  sourceIsTemplate,
} from "../GridLayoutContext";
import { initializeDragContainer } from "./tabstrip-drag-drop";
import type { TemplateDragSession } from "./TemplateDragSession";

type DragSourceDescriptor = {
  // TODO make optional default is self
  dropTargets: string[];
  orientation?: orientationType;
  payloadType?: string;
};

export type DropPosition = {
  position: "before" | "after";
  target: string;
};

export type DragSources = {
  [key: string]: DragSourceDescriptor;
};

export type DropProps<T extends DragSource = DragSource> = {
  dragSource: T;
  toId?: string;
  // The tab drop properties ...
  tabsId?: string;
  dropPosition?: DropPosition;
};

export type DropHandler<T extends DragSource = DragSource> = (
  dropProps: DropProps<T>,
) => void;

export type DragContextDropEvent = {
  type: "drop";
  dragSource: DragSource;
  tabsId: string;
  dropPosition: DropPosition;
};
export type DragContextDetachTabEvent = {
  gridId: string;
  itemId: string;
  type: "detach-tab";
  tabsId: string;
  value: string;
};
export type DragContextCancelTabDragEvent = Omit<
  DragContextDetachTabEvent,
  "type"
> & {
  type: "cancel-tab-drag";
};
export type DragContextCancelTabDragHandler = (
  evt: DragContextCancelTabDragEvent,
) => void;

export type DragContextDropHandler = (evt: DragContextDropEvent) => void;
export type DragContextDetachTabHandler = (
  evt: DragContextDetachTabEvent,
) => void;

export type DragContextEvents = {
  "cancel-tab-drag": DragContextCancelTabDragHandler;
  drop: DragContextDropHandler;
  "detach-tab": DragContextDetachTabHandler;
};

export class DragContext extends EventEmitter<DragContextEvents> {
  #dragElementWidth?: number;
  #dragLabelWidth?: number;
  #dragStateCleanups = new Set<() => void>();
  #dragSource?: DragSource;
  #dragSources: Map<string, DragSourceDescriptor> = new Map();
  #dropped = false;
  #dropPending = false;
  #dropZoneCache = new Map<HTMLElement, boolean>();
  #element?: HTMLElement;
  #mouseX = -1;
  #mouseY = -1;

  constructor(private readonly templateDragSession?: TemplateDragSession) {
    super();
  }

  beginDrag(e: DragEvent, dragSource: DragSource) {
    const { clientX: x, clientY: y, dataTransfer } = e;
    if (dataTransfer) {
      dataTransfer.effectAllowed = "move";
      if (sourceIsTemplate(dragSource)) {
        dataTransfer.setData("text/json", dragSource.componentJson);
      } else if (sourceIsComponent(dragSource)) {
        dataTransfer.setData("text/plain", dragSource.id);
      } else if (sourceIsTabbedComponent(dragSource)) {
        dataTransfer.setData("text/plain", dragSource.tab.id);
      } else {
        throw Error("[DragContextNext] unsupported drag source type");
      }
      const { height, width } = dragSource.element.getBoundingClientRect();
      let dragLabelWidth = width;
      if (sourceIsComponent(dragSource) && dragSource.dragElement) {
        dragLabelWidth = dragSource.dragElement.getBoundingClientRect()?.width;
      }

      this.#dragSource = dragSource;
      this.#dropped = false;
      this.#dropPending = false;
      this.#dragElementWidth = width;
      this.#dragLabelWidth = dragLabelWidth;
      this.#mouseX = x;
      this.#mouseY = y;
      if (sourceIsTemplate(dragSource)) {
        this.templateDragSession?.begin(dragSource, {
          elementHeight: height,
          elementWidth: width,
          labelWidth: dragLabelWidth,
          x,
          y,
        });
      }
    }
  }

  endDrag() {
    if (this.#dragSource && sourceIsTemplate(this.#dragSource)) {
      this.templateDragSession?.end();
    }
    this.#dropZoneCache.clear();
    this.#dragSource = undefined;
    this.#element = undefined;
    this.#dragElementWidth = undefined;
  }

  beginDrop() {
    this.#dropPending = true;
  }

  cancelDrag() {
    if (sourceIsTabbedComponent(this.#dragSource)) {
      const { layoutId: gridId, tabsId, label: value } = this.#dragSource;
      this.emit("cancel-tab-drag", {
        type: "cancel-tab-drag",
        gridId,
        itemId: this.#dragSource.tab.id,
        tabsId,
        value,
      });
    }
    for (const cleanup of this.#dragStateCleanups) {
      cleanup();
    }
    this.endDrag();
  }

  completeDrop() {
    const dragSource = this.dragSource;
    this.#dropped = true;
    this.#dropPending = false;
    if (dragSource && sourceIsTemplate(dragSource)) {
      this.templateDragSession?.completeDrop();
    }
    for (const cleanup of this.#dragStateCleanups) {
      cleanup();
    }
  }

  /**
   * A 'detached' tab is one that has been dragged from its place in tabstrip
   * but not yet dropped. If it is the selected tab, we want to avoid unmounting
   * the react component in the associated TabPanel. By marking it as 'detached'
   * the TabPanel is still rendered but not visible. When the tab is dropped, the
   * TabPanel can be assigned its new location (might still be within tabstrip, might
   * not be) and made visible, without ever having to unmount/remount.
   */
  detachTab(gridId: string, tabsId: string, itemId: string, value: string) {
    // console.log(
    //   `%c[DragContextNext] #${gridId}detachTab #${tabsId} tab (${value})`,
    //   "color:blue;font-weight:bold;",
    // );
    this.emit("detach-tab", {
      type: "detach-tab",
      gridId,
      itemId,
      tabsId,
      value,
    });
  }

  drop = ({
    tabsId,
    dropPosition,
  }: Pick<DragContextDropEvent, "tabsId" | "dropPosition">) => {
    const dragSource = this.dragSource;
    this.completeDrop();
    if (dragSource) {
      this.emit("drop", {
        type: "drop",
        dragSource,
        tabsId,
        dropPosition,
      });
    } else {
      throw Error("[DragContextNext] drop, dragSource not defined");
    }
  };

  registerTabsForDragDrop = (id: string) => {
    this.#dragSources.set(id, { dropTargets: ["*"] });
    const dragSourceElement = document.getElementById(`tabs-${id}`);
    if (dragSourceElement) {
      const cleanup = initializeDragContainer(
        dragSourceElement,
        this,
        "horizontal",
        id,
      );
      return () => {
        cleanup();
        this.#dragSources.delete(id);
      };
    } else {
      throw Error(
        `[DragContextNext] registerDragSource no element found for #tabs-${id}`,
      );
    }
  };

  registerDragStateCleanup = (cleanup: () => void) => {
    this.#dragStateCleanups.add(cleanup);
    return () => this.#dragStateCleanups.delete(cleanup);
  };

  get draggedElement() {
    const element = this.#element;
    if (element) {
      return element;
    } else {
      throw Error(
        "dragged element is unavailable because beginDrag was not called",
      );
    }
  }

  get dragElementWidth() {
    return (
      this.#dragElementWidth ??
      this.templateDragSession?.metrics?.elementWidth ??
      100
    );
  }

  get dragLabelWidth() {
    return (
      this.#dragLabelWidth ??
      this.templateDragSession?.metrics?.labelWidth ??
      this.dragElementWidth
    );
  }

  get dragSource() {
    return this.#dragSource ?? this.templateDragSession?.source;
  }

  get internalDragSources() {
    return this.#dragSources;
  }

  set dragSources(dragSources: DragSources) {
    this.buildDragSources(dragSources);
  }

  // get dragState() {
  //   if (
  //     this.#dragSource &&
  //     this.#height !== undefined &&
  //     this.#width !== undefined
  //   ) {
  //     return {
  //       element: this.#dragSource?.element,
  //       height: this.#height,
  //       sourceId: this.#dragSource.id,
  //       width: this.#width,
  //     };
  //   }
  // }

  get dropped() {
    const dragSource = this.dragSource;
    return dragSource && sourceIsTemplate(dragSource)
      ? (this.templateDragSession?.dropped ?? this.#dropped)
      : this.#dropped;
  }

  get dropPending() {
    return this.#dropPending;
  }

  get x() {
    return this.#dragSource === undefined && this.templateDragSession?.source
      ? (this.templateDragSession.metrics?.x ?? this.#mouseX)
      : this.#mouseX;
  }
  set x(value: number) {
    this.#mouseX = value;
    if (this.#dragSource === undefined && this.templateDragSession?.source) {
      this.templateDragSession.x = value;
    }
  }

  get y() {
    return this.#dragSource === undefined && this.templateDragSession?.source
      ? (this.templateDragSession.metrics?.y ?? this.#mouseY)
      : this.#mouseY;
  }
  set y(value: number) {
    this.#mouseY = value;
    if (this.#dragSource === undefined && this.templateDragSession?.source) {
      this.templateDragSession.y = value;
    }
  }

  get ownsDrag() {
    return this.#dragSource !== undefined;
  }

  private buildDragSources(dragSources: DragSources) {
    const sources = this.#dragSources;
    for (const [
      sourceId,
      { dropTargets, orientation = "horizontal" },
    ] of Object.entries(dragSources)) {
      sources.set(sourceId, { dropTargets, orientation });
    }
  }
}
