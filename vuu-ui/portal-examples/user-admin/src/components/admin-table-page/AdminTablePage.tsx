import {
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  Text,
} from "@salt-ds/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { ReactNode } from "react";
import { useRowCount } from "../../data/useRowCount";
import { PageHeader, plural } from "../admin-ui/AdminUi";

export interface AdminTablePageProps {
  actions?: ReactNode;
  className?: string;
  dataSource: DataSource;
  description: string;
  /** Singular noun for the row count, e.g. "group". */
  noun: string;
  filter: ReactNode;
  onPanelOpenChange: (open: boolean) => void;
  panelContent: ReactNode;
  panelHeading: ReactNode;
  panelOpen: boolean;
  table: ReactNode;
  title: string;
}

const RowCount = ({
  dataSource,
  noun,
}: {
  dataSource: DataSource;
  noun: string;
}) => (
  <Text aria-live="polite" className="vuuIdentityAdmin-count" color="secondary">
    {plural(useRowCount(dataSource), noun)}
  </Text>
);

/**
 * The layout shared by the Users, Groups and Roles pages: a header, a
 * toolbar, a table card and a side panel for the selected row.
 */
export const AdminTablePage = ({
  actions,
  className,
  dataSource,
  description,
  filter,
  noun,
  onPanelOpenChange,
  panelContent,
  panelHeading,
  panelOpen,
  table,
  title,
}: AdminTablePageProps) => (
  <SidePanelProvider open={panelOpen} onOpenChange={onPanelOpenChange}>
    <div className="vuuIdentityAdmin-pageWithPanel">
      <section className={`vuuIdentityAdmin-page ${className ?? ""}`.trim()}>
        <PageHeader actions={actions} description={description} title={title} />
        <div className="vuuIdentityAdmin-toolbar">
          {filter}
          <RowCount dataSource={dataSource} noun={noun} />
        </div>
        <div className="vuuIdentityAdmin-tableCard">{table}</div>
      </section>
      <SidePanel position="right" className="vuuIdentityAdmin-panel">
        <SidePanelHeader>
          {panelHeading}
          <SidePanelCloseButton />
        </SidePanelHeader>
        <SidePanelContent>{panelContent}</SidePanelContent>
      </SidePanel>
    </div>
  </SidePanelProvider>
);
