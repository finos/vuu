import type { VuuUser } from "@vuu-ui/vuu-utils";

export interface LayoutHistoryItem {
  user: string;
  id: string;
  uniqueId: string;
  lastUpdate: number;
}

export const getLayoutHistory = async (
  user: VuuUser,
): Promise<LayoutHistoryItem[]> => {
  const history = await fetch(`api/vui/${user.username}`, {})
    .then((response) => {
      return response.ok ? response.json() : null;
    })
    .catch(() => {
      // TODO we should set a layout with a warning here
      console.log("error getting history");
    });

  return history;
};
