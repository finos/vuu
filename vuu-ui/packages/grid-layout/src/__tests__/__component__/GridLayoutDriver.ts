import type { Locator, Page } from "@playwright/test";

export type DropZone =
  | "centre"
  | "east"
  | "header"
  | "north"
  | "south"
  | "west";

const targetPosition = {
  centre: { x: 0.5, y: 0.5 },
  east: { x: 0.9, y: 0.5 },
  header: { x: 0.5, y: 0.5 },
  north: { x: 0.5, y: 0.1 },
  south: { x: 0.5, y: 0.9 },
  west: { x: 0.1, y: 0.5 },
} as const;

export class GridLayoutDriver {
  constructor(
    private root: Locator,
    private page: Page,
  ) {}

  item(id: string) {
    return this.root.locator(`[id=${JSON.stringify(id)}]`);
  }

  layout(id: string) {
    return this.root.locator(`.vuuGridLayout[id=${JSON.stringify(id)}]`);
  }

  header(id: string) {
    return this.item(id).locator(".vuuGridLayoutItemHeader-title");
  }

  content(id: string) {
    return this.item(id).locator(".vuuGridLayoutItemContent");
  }

  placeholder() {
    return this.root.locator(".vuuGridPlaceholder");
  }

  separator(orientation?: "horizontal" | "vertical") {
    return orientation
      ? this.root.locator(
          `[role="separator"][aria-orientation="${orientation}"]`,
        )
      : this.root.getByRole("separator");
  }

  async gridArea(id: string) {
    return this.item(id).evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.gridRowStart}/${style.gridColumnStart}/${style.gridRowEnd}/${style.gridColumnEnd}`;
    });
  }

  async dragItem(
    id: string,
    targetId: string,
    zone: Exclude<DropZone, "header">,
  ) {
    await this.drag(this.header(id), this.content(targetId), zone);
  }

  async nativeDrag(source: Locator, target: Locator, zone: DropZone) {
    const targetBox = await target.boundingBox();
    if (!targetBox) {
      throw Error("GridLayoutDriver native drag requires visible elements");
    }
    const expectedClassName = `vuuDropTarget-${zone}`;
    await target.evaluate((element, className) => {
      document.documentElement.removeAttribute("data-grid-affordance-seen");
      const observer = new MutationObserver(() => {
        if (element.classList.contains(className)) {
          document.documentElement.setAttribute(
            "data-grid-affordance-seen",
            className,
          );
          observer.disconnect();
        }
      });
      observer.observe(element, { attributeFilter: ["class"] });
    }, expectedClassName);
    const position = targetPosition[zone];
    const nestedDragHandle = source.locator('[draggable="true"]');
    const dragHandle =
      (await nestedDragHandle.count()) > 0 ? nestedDragHandle.first() : source;
    await dragHandle.dragTo(target, {
      targetPosition: {
        x: targetBox.width * position.x,
        y: targetBox.height * position.y,
      },
    });
    const observedClassName = await this.page
      .locator("html")
      .getAttribute("data-grid-affordance-seen");
    if (observedClassName !== expectedClassName) {
      throw Error(
        `GridLayoutDriver expected native ${expectedClassName} affordance, received ${observedClassName}`,
      );
    }
  }

  async drag(source: Locator, target: Locator, zone: DropZone) {
    await this.nativeDrag(source, target, zone);
  }

  async dragTemplate(source: Locator, target: Locator, zone: DropZone) {
    await this.nativeDrag(source, target, zone);
  }

  async syntheticDrag(source: Locator, target: Locator, zone: DropZone) {
    const dataTransfer = await this.page.evaluateHandle(
      () => new DataTransfer(),
    );
    const box = await target.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver synthetic target has no bounding box");
    }
    const position = targetPosition[zone];
    const eventInit = {
      clientX: box.x + box.width * position.x,
      clientY: box.y + box.height * position.y,
      dataTransfer,
    };
    await source.dispatchEvent("dragstart", { dataTransfer });
    await target.dispatchEvent("dragenter", eventInit);
    await target.dispatchEvent("dragover", eventInit);
    await target.dispatchEvent("drop", eventInit);
    if ((await source.count()) > 0) {
      await source.dispatchEvent("dragend", { dataTransfer });
    }
    await dataTransfer.dispose();
  }

  async dragTemplateToTabs(source: Locator, tabList: Locator) {
    const box = await tabList.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver tab list has no bounding box");
    }
    await source.dragTo(tabList, {
      targetPosition: { x: box.width - 2, y: box.height / 2 },
    });
  }

  async attemptRejectedDrag(source: Locator, target: Locator, zone: DropZone) {
    const box = await target.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver target has no bounding box");
    }
    const position = targetPosition[zone];
    await target.evaluate((element) => {
      document.documentElement.removeAttribute("data-grid-affordance-seen");
      const observer = new MutationObserver(() => {
        if (
          [...element.classList].some((className) =>
            className.startsWith("vuuDropTarget-"),
          )
        ) {
          document.documentElement.setAttribute(
            "data-grid-affordance-seen",
            "true",
          );
          observer.disconnect();
        }
      });
      observer.observe(element, { attributeFilter: ["class"] });
    });
    await source.dragTo(target, {
      targetPosition: {
        x: box.width * position.x,
        y: box.height * position.y,
      },
    });
    return (
      (await this.page
        .locator("html")
        .getAttribute("data-grid-affordance-seen")) === "true"
    );
  }

  async resize(separator: Locator, deltaX: number, deltaY = 0) {
    const box = await separator.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver separator has no bounding box");
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + deltaX, y + deltaY, { steps: 10 });
    await this.page.mouse.up();
  }

  async resizeAndReturn(separator: Locator, deltaX: number, deltaY = 0) {
    const box = await separator.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver separator has no bounding box");
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + deltaX, y + deltaY, { steps: 10 });
    await this.page.mouse.move(x, y, { steps: 10 });
    await this.page.mouse.up();
  }
}
