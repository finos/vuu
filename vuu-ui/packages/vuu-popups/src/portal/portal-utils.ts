export const installTheme = (themeId) => {
  const installedThemes = getComputedStyle(document.body).getPropertyValue(
    "--installed-themes"
  );
  document.body.style.setProperty(
    "--installed-themes",
    `${installedThemes} ${themeId}`
  );
};
