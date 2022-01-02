const LEFT_RIGHT = ['left', 'right'];
const TOP_BOTTOM = ['top', 'bottom'];
// duplicated in repsonsive

export const measureElementSize = (element, dimension = 'width', includeAutoMargin = false) => {
  const { [dimension]: size } = element.getBoundingClientRect();
  const { padEnd = false, padStart = false } = element.dataset;
  const style = getComputedStyle(element);
  const [start, end] = dimension === 'width' ? LEFT_RIGHT : TOP_BOTTOM;
  const marginStart =
    padStart && !includeAutoMargin ? 0 : parseInt(style.getPropertyValue(`margin-${start}`), 10);
  const marginEnd =
    padEnd && !includeAutoMargin ? 0 : parseInt(style.getPropertyValue(`margin-${end}`), 10);

  let minWidth = size;
  const flexShrink = parseInt(style.getPropertyValue('flex-shrink'), 10);
  if (flexShrink > 0) {
    const flexBasis = parseInt(style.getPropertyValue('flex-basis'), 10);
    if (!isNaN(flexBasis) && flexBasis > 0) {
      minWidth = flexBasis;
    }
  }
  return marginStart + minWidth + marginEnd;
};

const DIMENSIONS = {
  horizontal: {
    CLIENT_SIZE: 'clientWidth',
    CONTRA: 'top',
    DIMENSION: 'width',
    END: 'right',
    POS: 'clientX',
    SCROLL_POS: 'scrollTop',
    SCROLL_SIZE: 'scrollWidth',
    START: 'left'
  },
  vertical: {
    CLIENT_SIZE: 'clientHeight',
    CONTRA: 'left',
    DIMENSION: 'height',
    END: 'bottom',
    POS: 'clientY',
    SCROLL_POS: 'scrollLeft',
    SCROLL_SIZE: 'scrollHeight',
    START: 'top'
  }
};
export const dimensions = (orientation) => DIMENSIONS[orientation];

export const measureDragThresholds = (container, orientation, draggable) => {
  const dragThresholds = [];
  const { END, DIMENSION, START } = dimensions(orientation);

  const start = performance.now();
  const { scrollTop } = container;
  const { [START]: offset } = container.getBoundingClientRect();
  const totalOffset = scrollTop - offset;

  Array.from(container.children).forEach((element) => {
    if (element !== draggable.element) {
      const { [START]: start, [END]: end, [DIMENSION]: size } = element.getBoundingClientRect();
      dragThresholds.push({
        element,
        start: start + totalOffset,
        end: end + totalOffset,
        size
      });
    }
  });
  const end = performance.now();
  console.log(`measureing elements took ${end - start} ms`);
  return dragThresholds;
};

export const prevThreshold = (thresholds, pos) => {
  const getThreshold = (i) => {
    if (i >= 0) {
      const { start, size } = thresholds[i];
      return start + size / 2;
    } else {
      return Number.MIN_SAFE_INTEGER;
    }
  };

  for (let index = thresholds.length - 1, t2 = getThreshold(index); index >= 0; index--) {
    const t1 = getThreshold(index - 1);
    if (pos > t2) {
      break;
    } else if (pos > t1) {
      return index;
    }
    t2 = t1;
  }
  return -1;
};

export const nextThreshold = (thresholds, pos, { size }) => {
  const getThreshold = (i) => {
    if (i < thresholds.length) {
      const { start, size: itemSize } = thresholds[i];
      return start + itemSize / 2 + size;
    } else {
      return Number.MAX_SAFE_INTEGER;
    }
  };

  // we could use a binary search to make this more efficient for large collections of children
  for (let index = 0, t1 = getThreshold(0), len = thresholds.length; index < len; index++) {
    const t2 = getThreshold(index + 1);
    if (pos < t1) {
      break;
    } else if (pos < t2) {
      return index;
    }
    t1 = t2;
  }
  return -1;
};
