import { useCallback } from "react";

export const useTreeNavPanel = () => {
  const handleCommit = useCallback(() => {
    console.log("onCommit");
  }, []);

  return {
    onCommit: handleCommit,
  };
};
