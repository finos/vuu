export const installTheme = (themeId: string) => {
  const installedThemes = getComputedStyle(document.body).getPropertyValue(
    "--installed-themes"
  );
  document.body.style.setProperty(
    "--installed-themes",
    `${installedThemes} ${themeId}`
  );
};
