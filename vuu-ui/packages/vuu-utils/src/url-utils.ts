export const getUrlParameter = (paramName: string, defaultValue?: string) =>
  new URL(document.location.href).searchParams.get(paramName) ?? defaultValue;

export const hasUrlParameter = (paramName: string) =>
  new URL(document.location.href).searchParams.has(paramName);
