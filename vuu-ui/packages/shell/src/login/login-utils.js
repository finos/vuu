const getCookieValue = (name) =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

export const getAuthDetailsFromCookies = () => {
  const username = getCookieValue('vuu-username');
  const token = getCookieValue('vuu-auth-token');
  return [username, token];
};

export const redirectToLogin = () => {
  window.location.href = '/login.html';
};

export const logout = () => {
  document.cookie = 'vuu-username= ; expires = Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'vuu-auth-token= ; expires = Thu, 01 Jan 1970 00:00:00 GMT';
  redirectToLogin();
};
