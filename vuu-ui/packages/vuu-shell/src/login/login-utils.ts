import { getCookieValue } from "@vuu-ui/vuu-utils";

export const getAuthModeFromCookies = (): string => {
  const mode = getCookieValue("vuu-auth-mode") as string;
  return mode ?? "";
};

export const getAuthDetailsFromCookies = (): [string, string] => {
  const username = getCookieValue("vuu-username") as string;
  const token = getCookieValue("vuu-auth-token") as string;
  return [username, token];
};

const getDefaultLoginUrl = () => {
  const authMode = getAuthModeFromCookies();
  return authMode === "login" ? "login.html" : "index.html";
};

export const redirectToLogin = (loginUrl = getDefaultLoginUrl()) => {
  window.location.href = loginUrl;
};

export const logout = (loginUrl?: string) => {
  document.cookie = "vuu-username= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "vuu-auth-token= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  redirectToLogin(loginUrl);
};
