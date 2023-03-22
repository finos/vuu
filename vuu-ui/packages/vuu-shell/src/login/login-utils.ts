import { getCookieValue } from "@finos/vuu-utils";

export const getAuthDetailsFromCookies = () => {
  const username = getCookieValue("vuu-username");
  const token = getCookieValue("vuu-auth-token");
  return [username, token];
};

export const redirectToLogin = (loginUrl = "/login.html") => {
  window.location.href = loginUrl;
};

export const logout = (loginUrl?: string) => {
  document.cookie = "vuu-username= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "vuu-auth-token= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  redirectToLogin(loginUrl);
};
