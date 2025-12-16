export const getLocalEntity = <T>(
  key: string,
  deleteOnRead = false,
): T | undefined => {
  const data = localStorage.getItem(key);
  if (data) {
    if (deleteOnRead) {
      localStorage.removeItem(key);
    }
    return JSON.parse(data);
  }
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

export const saveLocalEntity = <T>(key: string, data: T): T | undefined => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch {
    return undefined;
  }
};
