let size;

export function getScrollbarSize() {
  if (size === undefined) {
    let outer = document.createElement('div');
    outer.className = 'scrollable-content';
    outer.style.width = '50px';
    outer.style.height = '50px';
    outer.style.overflowY = 'scroll';
    outer.style.position = 'absolute';
    outer.style.top = '-200px';
    outer.style.left = '-200px';
    const inner = document.createElement('div');
    inner.style.height = '100px';
    inner.style.width = '100%';
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const outerWidth = outer.offsetWidth;
    const innerWidth = inner.offsetWidth;
    document.body.removeChild(outer);
    size = outerWidth - innerWidth;
    outer = null;
  }

  return size;
}
