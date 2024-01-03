import {
  GridLayoutModelPosition,
  IGridLayoutModelItem,
  SplitterAlign,
} from "./GridLayoutModel";

// Test if two positions occupy exactly the same track
const occupiesSameTrack = (
  { start: sourceStart, end: sourceEnd }: GridLayoutModelPosition,
  { start: targetStart, end: targetEnd }: GridLayoutModelPosition
) => targetStart === sourceStart && targetEnd === sourceEnd;

// Test if target position falls entirely within source position,
// possibly filling source, but no extending beyond.
const withinSameTrack = (
  { start: sourceStart, end: sourceEnd }: GridLayoutModelPosition,
  { start: targetStart, end: targetEnd }: GridLayoutModelPosition
) => targetStart >= sourceStart && targetEnd <= sourceEnd;

// Test if target directly abuts source
const inAdjacentTrack = (
  { start: sourceStart }: GridLayoutModelPosition,
  { end: targetEnd }: GridLayoutModelPosition
) => sourceStart === targetEnd;

export const collectColItems = (
  sourceGridItem: IGridLayoutModelItem,
  gridItem: IGridLayoutModelItem,
  splitterAlign: SplitterAlign,
  contraItems: IGridLayoutModelItem[],
  contraItemsMaybe: IGridLayoutModelItem[],
  contraItemsOtherTrack: IGridLayoutModelItem[],
  siblingItemsOtherTrack: IGridLayoutModelItem[],
  nonAdjacentItems: IGridLayoutModelItem[]
) => {
  const { column: colPosition, id, row: rowPosition } = sourceGridItem;
  const { column: col, row } = gridItem;

  console.log(
    `related item  (${id}) at row ${row} column ${col} splitter align ${splitterAlign}`
  );
  // A splitter with align start (the default) operates at the leading edge of the track, end splitters
  // operate at the trailing track edge.
  if ([col.start, col.end].includes(colPosition[splitterAlign])) {
    if (occupiesSameTrack(rowPosition, row)) {
      console.log(`${id} is contra-resize item`);
      contraItems.push(gridItem);
    } else if (withinSameTrack(rowPosition, row)) {
      console.log(`${id} is maybe a contra-resize item`);
      contraItemsMaybe.push(gridItem);
    } else if (inAdjacentTrack(colPosition, col)) {
      console.log(
        `${id} is on the other side of the splitter but in another row`
      );
      contraItemsOtherTrack.push(gridItem);
    } else {
      console.log(`${id} is a column sibling`);
      siblingItemsOtherTrack.push(gridItem);
    }
  } else {
    console.log(`${id} is a non adjacent item`);
    nonAdjacentItems.push(gridItem);
  }
};

export const collectRowItems = (
  sourceGridItem: IGridLayoutModelItem,
  gridItem: IGridLayoutModelItem,
  splitterAlign: SplitterAlign,
  contraItems: IGridLayoutModelItem[],
  contraItemsMaybe: IGridLayoutModelItem[],
  contraItemsOtherTrack: IGridLayoutModelItem[],
  siblingItemsOtherTrack: IGridLayoutModelItem[],
  nonAdjacentItems: IGridLayoutModelItem[]
) => {
  const { column: colPosition, id, row: rowPosition } = sourceGridItem;
  const { column: col, row } = gridItem;

  console.log(
    `related item  (${id}) at row ${row} column ${col} splitter align ${splitterAlign}`
  );
  // A splitter with align start (the default) operates at the leading edge of the track, end splitters
  // operate at the trailing track edge.
  if ([row.start, row.end].includes(rowPosition[splitterAlign])) {
    if (occupiesSameTrack(colPosition, col)) {
      console.log(`${id} is contra-resize item`);
      contraItems.push(gridItem);
    } else if (withinSameTrack(colPosition, col)) {
      console.log(`${id} is maybe a contra-resize item`);
      contraItemsMaybe.push(gridItem);
    } else if (inAdjacentTrack(rowPosition, row)) {
      console.log(
        `${id} is on the other side of the splitter but in another column`
      );
      contraItemsOtherTrack.push(gridItem);
    } else {
      console.log(`${id} is a row sibling`);
      siblingItemsOtherTrack.push(gridItem);
    }
  } else {
    console.log(`${id} is a non adjacent item`);
    nonAdjacentItems.push(gridItem);
  }
};
