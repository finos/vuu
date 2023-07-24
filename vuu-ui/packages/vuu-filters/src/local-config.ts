export const getLocalEntity = <T>(url: string): T | undefined => {
  const data = localStorage.getItem(url);
  return data ? JSON.parse(data) : undefined;
};

export const getAllLocalEntity = <T>(url: string): T[] =>
  Object.entries(localStorage)
    .filter(([key]) => key.includes(url))
    .map(([, value]) => JSON.parse(value) as T);

export const saveLocalEntity = <T>(url: string, data: T): T | undefined => {
  try {
    localStorage.setItem(url, JSON.stringify(data));
    return data;
  } catch {
    return undefined;
  }
};
