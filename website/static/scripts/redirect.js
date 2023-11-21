const url = new URL(window.location);
if (window.innerWidth > 1380 && url.pathname.indexOf("desktop") === -1) {
  window.location.href = "/desktop";
} else if (
  window.innerWidth <= 1380 &&
  url.pathname.indexOf("desktop") !== -1
) {
  window.location.href = window.location.href.replace("/desktop", "");
}
