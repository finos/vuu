function scrollPosition() {
  const scrollTop = document.documentElement.scrollTop
    ? document.documentElement.scrollTop
    : document.body.scrollTop;
  const scrollLeft = document.documentElement.scrollLeft
    ? document.documentElement.scrollLeft
    : document.body.scrollLeft;

  return { scrollTop, scrollLeft };
}

export function mousePosition(event) {
  const sPos = scrollPosition();

  const x = document.all ? event.clientX + sPos.scrollLeft : event.pageX;
  const y = document.all ? event.clientY + sPos.scrollTop : event.pageY;

  return { x, y };
}
