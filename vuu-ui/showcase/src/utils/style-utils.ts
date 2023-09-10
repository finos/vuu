export const addStylesheetURL = (url: string) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;

  // Stops the html-to-image package hitting CORs errors when manipulating stylesheets (see {@link https://stackoverflow.com/questions/49993633/uncaught-domexception-failed-to-read-the-cssrules-property} and {@link https://github.com/bubkoo/html-to-image/issues/40})
  link.crossOrigin = "anonymous";

  document.getElementsByTagName("head")[0].appendChild(link);
};
