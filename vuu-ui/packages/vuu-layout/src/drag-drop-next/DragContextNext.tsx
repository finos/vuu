import {
  asInteger,
  type orientationType,
  queryClosest,
} from "@finos/vuu-utils";

type DragSourceDescriptor = {
  // TODO make optional default is self
  dropTargets: string[];
  orientation?: orientationType;
  payloadType?: string;
};

export type DragSources = {
  [key: string]: DragSourceDescriptor;
};

export type DropProps = {
  fromId?: string;
  fromIndex: number;
  toId?: string;
  toIndex: number;
};

export type DropHandler = (dropProps: DropProps) => void;

type DragContextConstructorProps = {
  dragSources?: DragSources;
  local?: boolean;
  onDrop: DropHandler;
};

export interface IDragContext {
  allowDrag: false | "local" | "remote" | "both";
  beginDrag: (id: string, element: HTMLElement, index: number | string) => void;
  canDropHere: (target: EventTarget | HTMLElement | null) => boolean;
  draggedElement?: HTMLElement;
  dragSources?: DragSources;
  dragState?: {
    element?: HTMLElement;
    height: number;
    sourceId: string;
    width: number;
  };
  drop: (props: Pick<DropProps, "toId" | "toIndex">) => void;
  dropped: boolean;
  endDrag: (id: string) => void;
  isDraggable: boolean;
  isDragContainer: (id: string) => boolean;
  registerDragDropParty: (id: string) => void;
  withinDropZone: (target: EventTarget | HTMLElement | null) => boolean;
}

export class DragContext implements IDragContext {
  #dropZoneCache = new Map<HTMLElement, boolean>();
  #dragSourceId?: string;
  #dragSources?: Map<string, DragSourceDescriptor>;
  #dropHandler: DropHandler;
  #dropped = false;
  #element?: HTMLElement;
  #fromIndex: number | string | undefined;
  #height?: number;
  #isLocal?: boolean;
  #width?: number;
  constructor({
    dragSources,
    local = true,
    onDrop,
  }: DragContextConstructorProps) {
    console.log(`DragContext local ${local} `);
    this.#dropHandler = onDrop;
    this.#isLocal = local;
    if (dragSources) {
      this.#dragSources = dragSources
        ? this.buildDragSources(dragSources)
        : undefined;
    }
  }
  beginDrag(id: string, element: HTMLElement, index: number | string) {
    const { height, width } = element.getBoundingClientRect();
    this.#dragSourceId = id;
    this.#dropped = false;
    this.#fromIndex = index;
    this.#element = element;
    this.#height = height;
    this.#width = width;
  }

  withinDropZone(target: EventTarget | HTMLElement | null) {
    if (target) {
      const el = target as HTMLElement;
      let result = this.#dropZoneCache.get(el);
      if (result === undefined) {
        const dropSourceDescriptor = this.getDropTargets();
        result =
          dropSourceDescriptor !== undefined &&
          queryClosest(
            el,
            dropSourceDescriptor.dropTargets.map((id) => `#${id}`).join(","),
          ) !== null;
        this.#dropZoneCache.set(el, result);
      }
      return result;
    } else {
      return false;
    }
  }

  canDropHere(target: EventTarget | HTMLElement | null) {
    // TODO store both withinDropZOne and canDropn in same cache entities
    if (target && this.withinDropZone(target)) {
      return (target as HTMLElement).classList.contains("DragSpacer");
    } else {
      return false;
    }
  }

  endDrag() {
    this.#dropZoneCache.clear();
    this.#dragSourceId = undefined;
    this.#element = undefined;
    this.#height = undefined;
    this.#width = undefined;
  }

  drop = ({ toId, toIndex }: Pick<DropProps, "toId" | "toIndex">) => {
    this.#dropped = true;
    this.#dropHandler({
      fromId: this.#dragSourceId,
      fromIndex: this.fromIndex,
      toId,
      toIndex,
    });
  };

  registerDragDropParty(id: string) {
    console.log(`register dragdrop party ${id}`);
  }

  get allowDrag() {
    return this.#isLocal ? "local" : false;
  }

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

  get dragState() {
    const element = this.#element;
    const height = this.#height;
    const sourceId = this.#dragSourceId;
    const width = this.#width;
    if (element && height !== undefined && sourceId && width !== undefined) {
      return {
        element,
        height,
        sourceId,
        width,
      };
    }
  }

  get dropped() {
    return this.#dropped;
  }

  get fromIndex() {
    return asInteger(this.#fromIndex);
  }

  get id() {
    return this.#dragSourceId;
  }

  get isDraggable() {
    return this.allowDrag === "local";
  }

  private isDragSource(id: string) {
    return this.#dragSources?.has(id) ?? false;
  }

  isDragContainer = (id: string) => {
    return this.allowDrag === "local" || this.isDragSource(id);
  };

  private getDropTargets() {
    if (this.#dragSourceId && this.#dragSources) {
      return this.#dragSources.get(this.#dragSourceId);
    } else {
      throw Error(
        "[DragContext] dropTargets, dragSourceId or dragSources undefined",
      );
    }
  }

  private buildDragSources(dragSources: DragSources) {
    const sources = new Map<string, DragSourceDescriptor>();
    // TODO do we need the targets ?
    // const targets = new Map<string, string[]>();

    for (const [
      sourceId,
      { dropTargets, orientation = "horizontal" },
    ] of Object.entries(dragSources)) {
      sources.set(sourceId, { dropTargets, orientation });
      // for (const targetId of targetIds) {
      //   const targetEntry = targets.get(targetId);
      //   if (targetEntry) {
      //     targetEntry.push(sourceId);
      //   } else {
      //     targets.set(targetId, [sourceId]);
      //   }
      // }
    }
    // return [sources, targets];
    return sources;
  }
}
