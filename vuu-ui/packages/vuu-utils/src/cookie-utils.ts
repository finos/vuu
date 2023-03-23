export const getCookieValue = (name: string): string | number | undefined => {
  if (globalThis.document?.cookie !== undefined) {
    return globalThis.document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  }
};
