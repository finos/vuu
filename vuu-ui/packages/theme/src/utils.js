export const installTheme = (themeId) => {
  const installedThemes = getComputedStyle(document.body).getPropertyValue('--installed-themes');
  document.body.style.setProperty('--installed-themes', `${installedThemes} ${themeId}`);
};

let containerId = 1;

export const getPortalContainer = (x = 0, y = 0, win = window) => {
  // let el = document.body.querySelector('.hwReactPopup.' + group);
  // if (el === null) {
  let el = win.document.createElement('div');
  el.className = 'hwReactPopup ' + containerId++;
  el.style.cssText = `left:${x}px; top:${y}px;position: absolute;`;
  win.document.body.appendChild(el);
  return el;
};
