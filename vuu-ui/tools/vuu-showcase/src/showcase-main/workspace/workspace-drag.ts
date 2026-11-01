import { type TemplateSource, useDragContext } from "@vuu-ui/grid-layout";
import { type DragEvent, useCallback, useSyncExternalStore } from "react";
import { workspacePanelTemplate } from "./workspace-grid";

/** An example being dragged from the nav tree, to be added to a workspace */
export interface ExampleDrag {
  /** route of the example */
  path: string;
  title: string;
}

type Listener = () => void;

/**
 * The example currently being dragged, if any. Drop targets outside a
 * GridLayout (the example page, an empty workspace) subscribe to this.
 */
class ExampleDragStore {
  #drag: ExampleDrag | undefined;
  #listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  getSnapshot = () => this.#drag;

  set(drag: ExampleDrag | undefined) {
    if (drag !== this.#drag) {
      this.#drag = drag;
      this.#listeners.forEach((listener) => listener());
    }
  }
}

export const exampleDragStore = new ExampleDragStore();

export const useExampleDrag = () =>
  useSyncExternalStore(
    exampleDragStore.subscribe,
    exampleDragStore.getSnapshot,
  );

export const NAV_LAYOUT_ID = "showcase-nav";

const createDragImage = ({ path, title }: ExampleDrag) => {
  const chip = document.createElement("div");
  chip.className = "ShowcaseDragChip";
  const name = document.createElement("span");
  name.className = "ShowcaseDragChip-name";
  name.textContent = title;
  const route = document.createElement("span");
  route.className = "ShowcaseDragChip-path";
  route.textContent = path.slice(1).split("/").slice(0, -1).join(" / ");
  chip.append(name, route);
  // must be rendered (though not visible) when the drag image is captured
  (document.querySelector(".ShowcaseShell") ?? document.body).append(chip);
  return chip;
};

/**
 * Event handlers that make an element the drag source for an example. The
 * drag is registered with the GridLayout DragContext, so it can be dropped
 * into a workspace GridLayout, as well as with the ExampleDragStore.
 */
export const useExampleDragSource = (drag: ExampleDrag) => {
  const dragContext = useDragContext();

  const onDragStart = useCallback(
    (evt: DragEvent<HTMLElement>) => {
      evt.stopPropagation();
      const source: TemplateSource = {
        ...workspacePanelTemplate({
          examplePath: drag.path,
          title: drag.title,
        }),
        element: evt.currentTarget,
        layoutId: NAV_LAYOUT_ID,
        type: "template",
      };
      dragContext.beginDrag(evt.nativeEvent, source);
      evt.dataTransfer.effectAllowed = "copyMove";
      const chip = createDragImage(drag);
      evt.dataTransfer.setDragImage(chip, 12, 16);
      requestAnimationFrame(() => chip.remove());
      document.body.classList.add("ShowcaseExampleDragging");
      evt.currentTarget
        .closest(".vuuTableRow")
        ?.classList.add("ShowcaseDragSource");
      // deferred, changing the DOM during dragstart can abort the drag
      requestAnimationFrame(() => exampleDragStore.set(drag));
    },
    [dragContext, drag],
  );

  const onDragEnd = useCallback(
    (evt: DragEvent<HTMLElement>) => {
      evt.stopPropagation();
      dragContext.endDrag();
      document.body.classList.remove("ShowcaseExampleDragging");
      document
        .querySelectorAll(".ShowcaseDragSource")
        .forEach((el) => el.classList.remove("ShowcaseDragSource"));
      exampleDragStore.set(undefined);
    },
    [dragContext],
  );

  return { draggable: true, onDragEnd, onDragStart };
};
