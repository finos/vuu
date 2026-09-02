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
    const separators = this.root.getByRole("separator");
    return orientation
      ? separators.locator(`[aria-orientation="${orientation}"]`)
      : separators;
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

  async dragTemplate(source: Locator, target: Locator, zone: DropZone) {
    const sourceGrid = source.locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayout ')][1]",
    );
    const dataTransfer = await this.page.evaluateHandle(
      () => new DataTransfer(),
    );
    await source.dispatchEvent("dragstart", { dataTransfer });
    await this.waitForClass(sourceGrid, "vuuDragging");

    const position = targetPosition[zone];
    const { clientX, clientY } = await target.evaluate((element, { x, y }) => {
      const box = element.getBoundingClientRect();
      return {
        clientX: box.x + box.width * x,
        clientY: box.y + box.height * y,
      };
    }, position);
    const eventInit = { clientX, clientY, dataTransfer };
    await target.dispatchEvent("dragenter", eventInit);
    await target.dispatchEvent("dragover", eventInit);
    await target.dispatchEvent("dragover", eventInit);
    const dropTargetClass = await target.evaluate((element) =>
      [...element.classList].find((className) =>
        className.startsWith("vuuDropTarget-"),
      ),
    );
    if (dropTargetClass !== `vuuDropTarget-${zone}`) {
      const rect = await target.evaluate((element) => {
        const { bottom, left, right, top } = element.getBoundingClientRect();
        return { bottom, left, right, top };
      });
      throw Error(
        `GridLayoutDriver expected vuuDropTarget-${zone}, received ${dropTargetClass}; pointer ${clientX},${clientY}; rect ${JSON.stringify(rect)}`,
      );
    }
    await target.dispatchEvent("drop", eventInit);
    await source.dispatchEvent("dragend", { dataTransfer });
    await this.waitForClassRemoval(sourceGrid, "vuuDragging");
    if ((await target.count()) > 0) {
      await this.waitForClassPrefixRemoval(target, "vuuDropTarget-");
    }
    await dataTransfer.dispose();
  }

  async dragTemplateToTabs(source: Locator, tabList: Locator) {
    const sourceGrid = source.locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayout ')][1]",
    );
    const dataTransfer = await this.page.evaluateHandle(
      () => new DataTransfer(),
    );
    await source.dispatchEvent("dragstart", { dataTransfer });
    await this.waitForClass(sourceGrid, "vuuDragging");
    const { clientX, clientY } = await tabList.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        clientX: box.right - 2,
        clientY: box.y + box.height / 2,
      };
    });
    const eventInit = { clientX, clientY, dataTransfer };
    await tabList.dispatchEvent("dragenter", eventInit);
    await tabList.dispatchEvent("dragover", eventInit);
    await tabList.dispatchEvent("drop", eventInit);
    await source.dispatchEvent("dragend", { dataTransfer });
    await this.waitForClassRemoval(sourceGrid, "vuuDragging");
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

  private async waitForClassRemoval(locator: Locator, className: string) {
    await locator.evaluate((element, removedClassName) => {
      if (!element.classList.contains(removedClassName)) {
        return;
      }
      return new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (!element.classList.contains(removedClassName)) {
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

  private async waitForClassPrefixRemoval(locator: Locator, prefix: string) {
    await locator.evaluate((element, removedPrefix) => {
      const hasClass = () =>
        [...element.classList].some((className) =>
          className.startsWith(removedPrefix),
        );
      if (!hasClass()) {
        return;
      }
      return new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (!hasClass()) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(element, {
          attributeFilter: ["class"],
          attributes: true,
        });
      });
    }, prefix);
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
