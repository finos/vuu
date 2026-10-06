type VoidFunction = (...args: any) => void;
export type PerfFunction<T extends VoidFunction> = (
  ...args: Parameters<T>
) => void;

export function debounce<T extends VoidFunction>(
  callback: T,
  timeInterval: number
): PerfFunction<T> {
  let timeout: number | undefined;
  return (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), timeInterval);
  };
}

export function throttle<T extends VoidFunction>(
  callback: T,
  limit: number
): PerfFunction<T> {
  let wait = false;
  let lastArgs: unknown[] | undefined = undefined;

  function checkLastArgs() {
    if (lastArgs == undefined) {
      wait = false;
    } else {
      callback(...lastArgs);
      lastArgs = undefined;
      setTimeout(checkLastArgs, limit);
    }
  }

  return (...args: unknown[]) => {
    if (wait) {
      lastArgs = args;
    } else {
      callback(...args);
      wait = true;
      setTimeout(checkLastArgs, limit);
    }
  };
}
