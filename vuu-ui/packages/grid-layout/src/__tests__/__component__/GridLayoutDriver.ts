import type { Locator, Page } from "@playwright/experimental-ct-react";

export type DropZone = "centre" | "east" | "header" | "north" | "south" | "west";

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

  async dragItem(id: string, targetId: string, zone: Exclude<DropZone, "header">) {
    await this.drag(this.header(id), this.content(targetId), zone);
  }

  async drag(source: Locator, target: Locator, zone: DropZone) {
    const box = await target.boundingBox();
    if (!box) {
      throw Error("GridLayoutDriver target has no bounding box");
    }
    const position = targetPosition[zone];
    await source.dragTo(target, {
      targetPosition: {
        x: box.width * position.x,
        y: box.height * position.y,
      },
    });
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
