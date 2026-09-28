import {
  FlexLayout,
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  SidePanelTitle,
  Toolbar,
  Tooltray,
} from "@salt-ds/core";
import { useCallback, useState } from "react";
import { Table } from "@vuu-ui/vuu-table";
import { useUsersPage } from "./useUsersPage";
import { UserEditForm } from "../../components/user-edit-form/UserEditForm";
import type { DataRow, TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";
import { ApplicationFilter } from "../../components/ApplicationFilter";

export const UsersPage = () => {
  const [open, setOpen] = useState(false);
  const [dataRow, setDataRow] = useState<DataRow | undefined>();
  const { application, config, dataSource, setApplication } = useUsersPage();

  const handleSelect = useCallback<TableRowSelectHandler>((dataRow) => {
    if (dataRow) {
      setDataRow(dataRow);
      setOpen(true);
    } else {
      setDataRow(undefined);
      setOpen(false);
    }
  }, []);

  return (
    <EditModeProvider>
      <SidePanelProvider open={open} onOpenChange={setOpen}>
        <FlexLayout
          style={{
            width: "100%",
            height: "100%",
            border:
              "var(--salt-size-fixed-100) var(--salt-borderStyle-solid) var(--salt-container-bold-borderColor)",
            borderRadius: "var(--salt-palette-corner-weak)",
          }}
          gap={0}
        >
          <FlexLayout
            direction="column"
            style={{ flex: "1 1 auto", overflow: "hidden", padding: 8 }}
            gap={8}
          >
            <Toolbar style={{ flex: "0 0 32px" }}>
              <Tooltray>
                <ApplicationFilter
                  noAccessLabel="No application access"
                  onChange={setApplication}
                  value={application}
                />
              </Tooltray>
            </Toolbar>
            <div
              style={{ flex: "1 1 auto", height: "100%", overflow: "hidden" }}
            >
              <Table
                config={config}
                dataSource={dataSource}
                onSelect={handleSelect}
              />
            </div>
          </FlexLayout>
          <SidePanel position="right" className="vuuIdentityAdmin-panel">
            <SidePanelHeader>
              <SidePanelTitle>User Details</SidePanelTitle>
              <SidePanelCloseButton />
            </SidePanelHeader>
            <SidePanelContent>
              {dataRow ? (
                <UserEditForm dataRow={dataRow} dataSource={dataSource} />
              ) : null}
            </SidePanelContent>
          </SidePanel>
        </FlexLayout>
      </SidePanelProvider>
    </EditModeProvider>
  );
};
