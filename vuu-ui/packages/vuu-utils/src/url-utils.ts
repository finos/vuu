export const getUrlParameter = (paramName: string, defaultValue?: string) => {
  const url = new URL(document.location.href);
  const parameter = url.searchParams.get(paramName);
  if (parameter) {
    return parameter;
  }
  const hashParams = url.hash;
  const regex = new RegExp(`${paramName}=([a-zA-Z]*)`);
  const result = regex.exec(hashParams);
  if (result) {
    return result[1];
  }
  return defaultValue;
};

export const hasUrlParameter = (paramName: string) =>
  new URL(document.location.href).searchParams.has(paramName);
