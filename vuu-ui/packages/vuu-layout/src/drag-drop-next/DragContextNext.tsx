import { EventEmitter, type orientationType } from "@finos/vuu-utils";
import {
  DragSource,
  sourceIsComponent,
  sourceIsTabbedComponent,
  sourceIsTemplate,
} from "../grid-layout/GridLayoutContext";
import { initializeDragContainer } from "./drag-drop-listeners";

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

const defaultDropHandler = () =>
  console.log("no dropHandler has been attached");

export type DragContextDropEvent = {
  type: "drop";
  dragSource: DragSource;
  tabsId: string;
  dropPosition: DropPosition;
};
export type DragContextDetachTabEvent = {
  gridId: string;
  type: "detach-tab";
  tabsId: string;
  value: string;
};

export type DragContextDropHandler = (evt: DragContextDropEvent) => void;
export type DragContextDetachTabHandler = (
  evt: DragContextDetachTabEvent,
) => void;

export type DragContextEvents = {
  drop: DragContextDropHandler;
  "detach-tab": DragContextDetachTabHandler;
};

/**
 * This context is a global singleton. Even when DragDropProviders are nested,
 * a single instance of this context object is always used.
 */
export class DragContext extends EventEmitter<DragContextEvents> {
  #dragElementHeight?: number;
  #dragElementWidth?: number;
  #dragLabelWidth?: number;
  #dragSource?: DragSource;
  #dragSources: Map<string, DragSourceDescriptor> = new Map();
  #dropHandler: DropHandler = defaultDropHandler;
  #dropped = false;
  #dropZoneCache = new Map<HTMLElement, boolean>();
  #element?: HTMLElement;
  #mouseX = -1;
  #mouseY = -1;

  beginDrag(e: DragEvent, dragSource: DragSource) {
    const { clientX: x, clientY: y, dataTransfer } = e;
    console.log(`[DragContextNext] beginDrag #${dragSource.layoutId}`);
    if (dataTransfer) {
      dataTransfer.effectAllowed = "move";
      if (sourceIsTemplate(dragSource)) {
        dataTransfer.setData("text/json", dragSource.componentJson);
      } else if (sourceIsComponent(dragSource)) {
        dataTransfer.setData("text/plain", dragSource.id);
      } else if (sourceIsTabbedComponent(dragSource)) {
        dataTransfer.setData("text/plain", dragSource.tab.id);
      } else {
        throw Error("whaat");
      }
      const { height, width } = dragSource.element.getBoundingClientRect();
      this.#dragSource = dragSource;
      this.#dropped = false;
      this.#dragElementHeight = height;
      this.#dragElementWidth = width;
      this.#mouseX = x;
      this.#mouseY = y;
    }
  }

  endDrag() {
    this.#dropZoneCache.clear();
    this.#dragSource = undefined;
    this.#element = undefined;
    this.#dragElementHeight = undefined;
    this.#dragElementWidth = undefined;
  }

  /**
   * A 'detached' tab is one that has been dragged from its place in tabstrip
   * but not yet dropped. If it is the selected tab, we want to avoid unmounting
   * the react component in the associated TabPanel. By marking it as 'detached'
   * the TabPanel is still rendered but not visible. When the tab is dropped, the
   * TabPanel can be assigned its new location (might still be within tabstrip, might
   * not be) and made visible, without ever having to unmount/remount.
   */
  detachTab(gridId: string, tabsId: string, value: string) {
    console.log(
      `%c[DragContextNext] #${gridId}detachTab #${tabsId} tab (${value})`,
      "color:blue;font-weight:bold;",
    );
    // change dragSource to component
    console.log({
      dragSource: this.#dragSource,
    });

    this.emit("detach-tab", { type: "detach-tab", gridId, tabsId, value });
  }

  drop = ({
    tabsId,
    dropPosition,
  }: Pick<DragContextDropEvent, "tabsId" | "dropPosition">) => {
    console.log(
      `[DragContextNext] drop at #${tabsId} ${dropPosition?.position} ${dropPosition?.target}`,
    );
    this.#dropped = true;
    if (this.#dragSource) {
      this.emit("drop", {
        type: "drop",
        dragSource: this.#dragSource,
        tabsId,
        dropPosition,
      });
    } else {
      throw Error("[DragContextNext] drop, dragSource not defined");
    }
  };

  registerTabsForDragDrop = (id: string) => {
    console.log(`[DragContextNext] registerDragSource #${id}`);
    this.#dragSources.set(id, { dropTargets: ["*"] });
    const dragSourceElement = document.getElementById(id);
    if (dragSourceElement) {
      initializeDragContainer(dragSourceElement, this);
    } else {
      throw Error(
        `[DragDropProviderNext] registerDragSource no element found for #${id}`,
      );
    }
  };

  get draggedElement() {
    const element = this.#element;
    if (element) {
      return element;
    } else {
      throw Error(
        `dragged element is being accessed, but drag is not in effect, of beginDrag was not called`,
      );
    }
  }

  get dragElementWidth() {
    return this.#dragElementWidth ?? 100;
  }

  get dragSource() {
    return this.#dragSource;
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

  set dropHandler(dropHandler: DropHandler) {
    if (this.#dropHandler === defaultDropHandler) {
      console.log("[DragContextNext] set dropHandler");
    } else {
      console.log(
        "[DragContextNext] set dropHandler - WARNING overwriting existing value",
      );
    }
    this.#dropHandler = dropHandler;
  }

  get dropped() {
    return this.#dropped;
  }

  get x() {
    return this.#mouseX;
  }
  set x(value: number) {
    this.#mouseX = value;
  }

  get y() {
    return this.#mouseY;
  }
  set y(value: number) {
    this.#mouseY = value;
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
