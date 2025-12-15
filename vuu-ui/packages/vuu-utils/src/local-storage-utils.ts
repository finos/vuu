export const getLocalEntity = <T>(key: string): T | undefined => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : undefined;
};

export const clearLocalEntity = (key: string) => {
  const doomedItem = localStorage.getItem(key);
  if (doomedItem) {
    localStorage.removeItem(key);
    return true;
  } else {
    return false;
  }
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
