import {
  SidePanel,
  type SidePanelProps,
  SidePanelProvider,
  type SidePanelProviderProps,
  Text,
} from "@salt-ds/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import cx from "clsx";
import type { ReactNode } from "react";
import { useRowCount } from "../../data/useRowCount";
import { plural } from "../admin-ui/AdminUi";

/*
 * The layout pieces shared by the Users, Groups and Roles pages:
 *
 *   AdminPageWithPanel (or a TableWithEditForm, which drives the panel itself)
 *     AdminPage
 *       PageHeader
 *       AdminToolbar  (a filter, RowCount …)
 *       AdminTableCard (the table)
 *     AdminPanel  (SidePanelHeader, SidePanelContent)
 */

export const adminPageWithPanelClassName = "vuuIdentityAdmin-pageWithPanel";

/** A page with a side panel, the panel's open state managed by the caller. */
export const AdminPageWithPanel = ({
  children,
  onOpenChange,
  open,
}: Pick<SidePanelProviderProps, "onOpenChange" | "open"> & {
  children: ReactNode;
}) => (
  <SidePanelProvider open={open} onOpenChange={onOpenChange}>
    <div className={adminPageWithPanelClassName}>{children}</div>
  </SidePanelProvider>
);

export const AdminPage = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section className={cx("vuuIdentityAdmin-page", className)}>
    {children}
  </section>
);

export const AdminToolbar = ({ children }: { children: ReactNode }) => (
  <div className="vuuIdentityAdmin-toolbar">{children}</div>
);

/** The live row count of `dataSource`, e.g. "12 users". */
export const RowCount = ({
  dataSource,
  noun,
}: {
  dataSource: DataSource;
  /** Singular noun, e.g. "group". */
  noun: string;
}) => (
  <Text aria-live="polite" className="vuuIdentityAdmin-count" color="secondary">
    {plural(useRowCount(dataSource), noun)}
  </Text>
);

export const AdminTableCard = ({ children }: { children: ReactNode }) => (
  <div className="vuuIdentityAdmin-tableCard">{children}</div>
);

/** The right hand side panel. Compose SidePanelHeader and SidePanelContent. */
export const AdminPanel = ({ className, ...props }: SidePanelProps) => (
  <SidePanel
    {...props}
    className={cx("vuuIdentityAdmin-panel", className)}
    position="right"
  />
);
