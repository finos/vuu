export const getCookieValue = (name: string): string | number | undefined => {
  if (global.document?.cookie !== undefined) {
    return global.document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  }
};

