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
    return this.root.locator(`#${id}`);
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

  separator() {
    return this.root.getByRole("separator");
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

  async drag(source: Locator, target: Locator, zone: DropZone) {
    const dataTransfer = await this.page.evaluateHandle(
      () => new DataTransfer(),
    );
    await source.dispatchEvent("dragstart", { dataTransfer });
    await this.waitForClass(
      source.locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayoutItem ')][1]",
      ),
      "vuuGridLayoutItem-dragging",
    );

    const box = await target.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver target has no bounding box");
    }
    const position = targetPosition[zone];
    const clientX = box.x + box.width * position.x;
    const clientY = box.y + box.height * position.y;
    const eventInit = { clientX, clientY, dataTransfer };

    await target.dispatchEvent("dragenter", eventInit);
    await target.dispatchEvent("dragover", eventInit);
    await this.waitForClass(target, `vuuDropTarget-${zone}`);
    await target.dispatchEvent("drop", eventInit);
    if ((await source.count()) > 0) {
      await source.dispatchEvent("dragend", { dataTransfer });
    }
    await dataTransfer.dispose();
  }

  async attemptRejectedDrag(source: Locator, target: Locator, zone: DropZone) {
    const dataTransfer = await this.page.evaluateHandle(
      () => new DataTransfer(),
    );
    await source.dispatchEvent("dragstart", { dataTransfer });
    await this.waitForClass(
      source.locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayoutItem ')][1]",
      ),
      "vuuGridLayoutItem-dragging",
    );

    const box = await target.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver target has no bounding box");
    }
    const position = targetPosition[zone];
    const eventInit = {
      clientX: box.x + box.width * position.x,
      clientY: box.y + box.height * position.y,
      dataTransfer,
    };
    await target.dispatchEvent("dragenter", eventInit);
    await target.dispatchEvent("dragover", eventInit);
    const accepted = await target.evaluate((element) =>
      [...element.classList].some((className) =>
        className.startsWith("vuuDropTarget-"),
      ),
    );
    await target.dispatchEvent("drop", eventInit);
    await source.dispatchEvent("dragend", { dataTransfer });
    await dataTransfer.dispose();
    return accepted;
  }

  private async waitForClass(locator: Locator, className: string) {
    await locator.evaluate((element, expectedClassName) => {
      if (element.classList.contains(expectedClassName)) {
        return;
      }
      return new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.classList.contains(expectedClassName)) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(element, {
          attributeFilter: ["class"],
          attributes: true,
        });
      });
    }, className);
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
}
