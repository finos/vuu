import { usePortalModuleInstanceId } from "@vuu-ui/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { createContext, useContext } from "react";

const DEFAULT_SCOPE = "basket-trading";

/**
 * The scope of this Basket Trading instance's session data sources. Each
 * instance, e.g. each workspace item or layout view, has its own data
 * sources, so that one instance never subscribes to, suspends or filters
 * another's.
 */
export const useBasketSessionScope = () => {
  const moduleInstanceId = usePortalModuleInstanceId();
  const { id: viewId } = useViewContext();
  return moduleInstanceId ?? viewId ?? DEFAULT_SCOPE;
};

/** The session key of one of an instance's data sources. */
export const basketSessionKey = (scope: string, key: string) =>
  `${scope}-${key}`;

/**
 * The basket constituents data source of this Basket Trading instance, for
 * the Add constituent column header.
 */
export const BasketConstituentsContext = createContext<DataSource | undefined>(
  undefined,
);

export const useBasketConstituentsDataSource = () => {
  const dataSource = useContext(BasketConstituentsContext);
  if (dataSource === undefined) {
    throw Error(
      "useBasketConstituentsDataSource must be used within a BasketConstituentsContext",
    );
  }
  return dataSource;
};
