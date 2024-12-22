import { type orientationType } from "@finos/vuu-utils";

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
  dragSource: DragSource;
  toId?: string;
  toIndex: number;
};

export type DropHandler = (dropProps: DropProps) => void;

/**
 * provides details of a dragged component
 */
export type ComponentDragSource = {
  id: string;
  element: HTMLElement;
  index: number;
  label: string;
  type: "component";
};

/**
 * provides details of a template, to be used on drop to instantiate  a new component
 */
export type TemplateDragSource = {
  componentJson: string;
  element: HTMLElement;
  index: number;
  label: string;
  type: "template";
};

export type DragSource = ComponentDragSource | TemplateDragSource;

export const sourceIsComponent = (
  source: DragSource,
): source is ComponentDragSource => source.type === "component";

export const sourceIsTemplate = (
  source: DragSource,
): source is TemplateDragSource => source.type === "template";

/**
 * This context is a global singleton. Even when DragDropProviders are nested,
 * a single instance of this context object is always used.
 */
export class DragContext {
  #dropZoneCache = new Map<HTMLElement, boolean>();
  #dragSource?: DragSource;
  #dragSources?: Map<string, DragSourceDescriptor>;
  #dropHandler: DropHandler = () =>
    console.log("no dropHandler has been attached");
  #dropped = false;
  #element?: HTMLElement;
  #height?: number;
  #mouseX = -1;
  #mouseY = -1;
  #width?: number;

  beginDrag(e: DragEvent, dragSource: DragSource) {
    const { clientX: x, clientY: y, dataTransfer } = e;
    if (dataTransfer) {
      dataTransfer.effectAllowed = "move";
      if (sourceIsTemplate(dragSource)) {
        dataTransfer.setData("text/json", dragSource.componentJson);
      } else {
        dataTransfer.setData("text/plain", dragSource.id);
      }
      const { height, width } = dragSource.element.getBoundingClientRect();
      this.#dragSource = dragSource;
      this.#dropped = false;
      this.#height = height;
      this.#width = width;
      this.#mouseX = x;
      this.#mouseY = y;
    }
  }

  endDrag() {
    this.#dropZoneCache.clear();
    this.#dragSource = undefined;
    this.#element = undefined;
    this.#height = undefined;
    this.#width = undefined;
  }

  drop = ({ toId, toIndex }: Pick<DropProps, "toId" | "toIndex">) => {
    this.#dropped = true;
    if (this.#dragSource) {
      this.#dropHandler({
        dragSource: this.#dragSource,
        toId,
        toIndex,
      });
    } else {
      throw Error("[DragContextNext] drop, dragSource not defined");
    }
  };

  registerDragDropParty(id: string) {
    console.log(`register dragdrop party ${id}`);
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

  get dragSource() {
    return this.#dragSource;
  }

  set dragSources(dragSources: DragSources) {
    this.#dragSources = this.buildDragSources(dragSources);
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

  private isDragSource(id: string) {
    return this.#dragSources?.has(id) ?? false;
  }

  private buildDragSources(dragSources: DragSources) {
    const sources = new Map<string, DragSourceDescriptor>();
    // TODO do we need the targets ?

    for (const [
      sourceId,
      { dropTargets, orientation = "horizontal" },
    ] of Object.entries(dragSources)) {
      sources.set(sourceId, { dropTargets, orientation });
    }
    return sources;
  }
}
