export const addStylesheetURL = (url: string) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.getElementsByTagName("head")[0].appendChild(link);
};
