import { ReactElement, useCallback, useState } from "react";
import type {
  Contribution,
  ContributionLocation,
} from "../layout-view/viewTypes";

const sessionState = new Map<string, Contribution[]>();

const EMPTY_ARRAY: Contribution[] = [];

export const useViewContributions = ({
  sessionKey,
}: {
  sessionKey: string;
}) => {
  const [contributions, setContributions] =
    useState<Contribution[]>(EMPTY_ARRAY);

  const updateContributions = useCallback(
    (location: ContributionLocation, content: ReactElement) => {
      const updatedContributions = contributions.concat([
        { location, content },
      ]);
      sessionState.set(sessionKey, updatedContributions);
      setContributions(updatedContributions);
    },
    [contributions, sessionKey],
  );

  const clearContributions = useCallback(() => {
    sessionState.delete(sessionKey);
    setContributions([]);
  }, [sessionKey]);

  return {
    clearContributions,
    contributions,
    updateContributions,
  };
};
