export const getCookieValue = (name: string): string | undefined => {
  if (globalThis.document?.cookie !== undefined) {
    return globalThis.document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  }
};

/**
 * Sets a cookie value.
 *
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} [days] - Optional: number of days until the cookie expires
 */
export function setCookieValue(name: string, value: string, days?: number) {
  let expires = "";

  if (typeof days === "number") {
    const date = new Date();
    // days -> milliseconds
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }

  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);

  document.cookie = `${encodedName}=${encodedValue}${expires};`;
}
