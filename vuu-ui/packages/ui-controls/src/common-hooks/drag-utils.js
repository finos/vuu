const LEFT_RIGHT = ["left", "right"];
const TOP_BOTTOM = ["top", "bottom"];
// duplicated in repsonsive

export const measureElementSizeAndPosition = (
  element,
  dimension = "width",
  includeAutoMargin = false
) => {
  const pos = dimension === "width" ? "left" : "top";
  const { [dimension]: size, [pos]: position } =
    element.getBoundingClientRect();
  const { padEnd = false, padStart = false } = element.dataset;
  const style = getComputedStyle(element);
  const [start, end] = dimension === "width" ? LEFT_RIGHT : TOP_BOTTOM;
  const marginStart =
    padStart && !includeAutoMargin
      ? 0
      : parseInt(style.getPropertyValue(`margin-${start}`), 10);
  const marginEnd =
    padEnd && !includeAutoMargin
      ? 0
      : parseInt(style.getPropertyValue(`margin-${end}`), 10);

  let minWidth = size;
  const flexShrink = parseInt(style.getPropertyValue("flex-shrink"), 10);
  if (flexShrink > 0) {
    const flexBasis = parseInt(style.getPropertyValue("flex-basis"), 10);
    if (!isNaN(flexBasis) && flexBasis > 0) {
      minWidth = flexBasis;
    }
  }
  return [position, marginStart + minWidth + marginEnd];
};

const DIMENSIONS = {
  horizontal: {
    CLIENT_SIZE: "clientWidth",
    CONTRA: "top",
    DIMENSION: "width",
    END: "right",
    POS: "clientX",
    SCROLL_POS: "scrollLeft",
    SCROLL_SIZE: "scrollWidth",
    START: "left",
  },
  vertical: {
    CLIENT_SIZE: "clientHeight",
    CONTRA: "left",
    DIMENSION: "height",
    END: "bottom",
    POS: "clientY",
    SCROLL_POS: "scrollTop",
    SCROLL_SIZE: "scrollHeight",
    START: "top",
  },
};
export const dimensions = (orientation) => DIMENSIONS[orientation];

export const getDraggedItem = (measuredItems) => {
  const result = measuredItems.find((item) => item.isDraggedElement);
  if (result) {
    return result;
  } else {
    throw Error("measuredItems do not contain a draggedElement");
  }
};

// During most drag operations, we will be switching adjacent items.
// Immediately after a scroll operation, though, the dragged Item
// will likely be distant from the first dropTarget.
export const moveDragItem = (measuredItems, dropTarget) => {
  const items = measuredItems.slice();
  const draggedItem = getDraggedItem(items);
  const draggedIndex = items.indexOf(draggedItem);
  const targetIndex = items.indexOf(dropTarget);

  let firstPos = Math.min(draggedIndex, targetIndex);
  let newDraggedItemIndex = targetIndex;
  const lastPos = Math.max(draggedIndex, targetIndex);

  if (Math.abs(draggedIndex - targetIndex) === 1) {
    items[draggedIndex] = { ...dropTarget };
    items[targetIndex] = { ...draggedItem };
  } else {
    items.splice(draggedIndex, 1);
    if (draggedIndex > targetIndex) {
      items.splice(newDraggedItemIndex, 0, draggedItem);
    } else {
      newDraggedItemIndex = targetIndex - 1;
      items.splice(newDraggedItemIndex, 0, draggedItem);
    }
  }

  if (firstPos === draggedIndex) {
    for (let i = firstPos, prevItem = null; i <= lastPos; i++) {
      const item = items[i];
      item.currentIndex = i;
      if (i === lastPos) {
        item.start = prevItem.end;
        item.mid = prevItem.end + item.size / 2;
        item.end = prevItem.end + item.size;
      } else {
        item.start -= draggedItem.size;
        item.mid -= draggedItem.size;
        item.end -= draggedItem.size;
      }
      prevItem = item;
    }
  } else {
    for (let i = firstPos; i <= lastPos; i++) {
      const item = items[i];
      item.currentIndex = i;
      if (i === firstPos) {
        if (i > 0) {
          item.start = items[i - 1].end;
          item.mid = item.start + item.size / 2;
          item.end = item.start + item.size;
        }
      } else {
        if (firstPos === 0 && i === firstPos + 1) {
          items[firstPos].start = item.start;
          items[firstPos].mid = item.start + items[firstPos].size / 2;
          items[firstPos].end = item.start + items[firstPos].size;
        }

        item.start += draggedItem.size;
        item.mid += draggedItem.size;
        item.end += draggedItem.size;
      }
    }
  }

  // onsole.table(
  //   items
  //     .slice(Math.max(0, firstPos - 3), lastPos + 3)
  //     .map((t) => ({ label: t.element.textContent, start: t.start, end: t.end, size: t.size }))
  // );
  return items;
};

export const isDraggedElement = (item) => item.isDraggedElement;

export const measureDropTargets = (
  container,
  orientation,
  draggedItem,
  itemQuery
) => {
  const dropTargets = [];
  const startTime = performance.now();

  const adjustmentForDraggedItem = draggedItem.size || 0;
  let appliedAdjustment = 0;
  // TODO need to make sure we're including only the children we should
  const children = Array.from(
    itemQuery ? container.querySelectorAll(`${itemQuery}`) : container.children
  );
  for (let index = 0, len = children.length; index < len; index++) {
    const element = children[index];
    const dimension = orientation === "horizontal" ? "width" : "height";
    let [start, size] = measureElementSizeAndPosition(element, dimension);
    const isDraggedElement = element === draggedItem.element;
    const adjustedSize = isDraggedElement ? draggedItem?.size ?? size : size;
    const isLast = index === len - 1;

    dropTargets.push({
      currentIndex: index,
      index,
      isDraggedElement,
      isLast,
      element: element,
      start: start + appliedAdjustment,
      end: start + adjustedSize + appliedAdjustment,
      // first measurement, the draggeditem will have size. Subsequent measurements
      // will be triggered by drag-scroll, at which point draggedItem has zero size
      // but original size will be passed in with draggedItem param.
      size: adjustedSize,
      mid: start + appliedAdjustment + adjustedSize / 2,
    });

    if (isDraggedElement) {
      appliedAdjustment = adjustmentForDraggedItem;
    }
  }
  const endTime = performance.now();
  console.log(`measuring elements took ${endTime - startTime} ms`);
  // onsole.table(dropTargets.map((t) => [t.element.textContent, t.start, t.end, t.size]));
  return dropTargets;
};

export const getNextDropTarget = (dropTargets, pos, direction) => {
  const len = dropTargets.length;
  if (direction === "fwd") {
    for (let index = 0; index < len; index++) {
      let dropTarget = dropTargets[index];
      const { start, mid, end } = dropTarget;
      if (pos > end) {
        continue;
      } else if (pos > mid) {
        return dropTarget;
      } else if (index > 0 && pos > start) {
        dropTarget = dropTargets[index - 1];
        return dropTarget;
      }
    }
  } else {
    for (let index = len - 1; index >= 0; index--) {
      let dropTarget = dropTargets[index];
      const { start, mid, end } = dropTarget;
      if (pos < start) {
        continue;
      } else if (pos < mid) {
        return dropTarget;
      } else if (pos < end) {
        dropTarget = dropTargets[Math.min(len - 1, index + 1)];
        return dropTarget;
      }
    }
  }
  return null;
};
