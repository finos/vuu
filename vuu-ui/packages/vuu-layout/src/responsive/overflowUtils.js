export const getOverflowedItems = (containerRef, height = 64) => {
  const elements = Array.from(containerRef.current.childNodes);
  const firstOverflowIdx = findFirstOverflow(elements, height);
  return [elements.slice(0, firstOverflowIdx), elements.slice(firstOverflowIdx)];
};

export const findFirstOverflow = (elements, height) => {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].offsetTop >= height) {
      return i;
    }
  }
  return -1;
};
