import { type ReactNode, useMemo } from "react";
import { AdminRpcContext } from "./admin-rpc";
import {
  ApplicationModelContext,
  useLoadApplicationModel,
} from "./useApplicationModel";

/**
 * Publishes the application model, and the RPC function every admin write
 * goes through.
 */
export const ApplicationModelProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { error, loading, model, rpc } = useLoadApplicationModel();
  const resource = useMemo(
    () => ({ error, loading, model }),
    [error, loading, model],
  );
  return (
    <ApplicationModelContext.Provider value={resource}>
      <AdminRpcContext.Provider value={rpc}>
        {children}
      </AdminRpcContext.Provider>
    </ApplicationModelContext.Provider>
  );
};
