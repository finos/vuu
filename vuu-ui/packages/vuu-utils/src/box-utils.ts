export interface rect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}
export type rectTuple = [number, number, number, number];

export type dimension = "width" | "height";

export function boxContainsPoint(rect: rect, x: number, y: number) {
  if (rect) {
    return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
  }
}
