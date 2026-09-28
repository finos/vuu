import {
  Button,
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
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import { GroupsEditForm } from "../../components/groups-edit-form/GroupsEditForm";
import { useGroupsPage } from "./useGroupsPage";

import "./GroupsPage.css";

const classBase = "vuuGroupsPage";

export const GroupsPage = () => {
  const {
    close,
    config,
    createGroup,
    dataRow,
    dataSource,
    onSelect,
    open,
    setOpen,
  } = useGroupsPage();

  return (
    <EditModeProvider isEditMode={dataRow && dataRow.group_id === undefined}>
      <SidePanelProvider
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
          } else {
            close();
          }
        }}
      >
        <FlexLayout
          className={classBase}
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
              <Tooltray align="end">
                <Button className={`${classBase}-add`} onClick={createGroup}>
                  Create Group
                </Button>
              </Tooltray>
            </Toolbar>

            <div style={{ flex: "1 1 auto", height: "100%", overflow: "hidden" }}>
              <Table
                config={config}
                dataSource={dataSource}
                onSelect={onSelect}
              />
            </div>
          </FlexLayout>
          <SidePanel position="right" className="vuuIdentityAdmin-panel">
            <SidePanelHeader>
              <SidePanelCloseButton />
              <SidePanelTitle>Group Details</SidePanelTitle>
            </SidePanelHeader>
            <SidePanelContent>
              {dataRow ? (
                <GroupsEditForm
                  dataRow={dataRow}
                  dataSource={dataSource}
                  onClose={close}
                />
              ) : null}
            </SidePanelContent>
          </SidePanel>
        </FlexLayout>
      </SidePanelProvider>
    </EditModeProvider>
  );
};
