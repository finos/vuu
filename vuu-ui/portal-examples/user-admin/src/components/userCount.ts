import { useMemo } from "react";
import { moduleAccessFilter } from "../data/applications";
import { USER_ADMIN_TABLES } from "../data/user-admin-tables";
import { useFilteredCount } from "../data/useFilteredCount";

/** Live count of users who can open the application. */
export const useUserCount = (accessRole: string) => {
  const filter = useMemo(() => moduleAccessFilter(accessRole), [accessRole]);
  return useFilteredCount(USER_ADMIN_TABLES.users, "user_id", filter);
};

export const formatCount = ({
  count,
  error,
}: {
  count?: number;
  error?: string;
}) => (error ? "–" : count === undefined ? "…" : count.toLocaleString());
