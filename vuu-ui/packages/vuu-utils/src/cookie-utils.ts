export const getCookieValue = (name: string):string | number | undefined => {
  return document.cookie
  .split("; ")
  .find((row) => row.startsWith(`${name}=`))
  ?.split("=")[1];
}
