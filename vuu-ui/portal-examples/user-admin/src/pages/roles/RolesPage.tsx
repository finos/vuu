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
import { ApplicationFilter } from "../../components/ApplicationFilter";
import { RolesEditForm } from "../../components/roles-edit-form/RolesEditForm";
import { useRolesPage } from "./useRolesPage";

import "./RolesPage.css";

const classBase = "vuuRolesPage";

export const RolesPage = () => {
  const {
    application,
    close,
    config,
    createRole,
    dataRow,
    dataSource,
    onSelect,
    open,
    setApplication,
    setOpen,
  } = useRolesPage();

  return (
    <EditModeProvider isEditMode={dataRow && dataRow?.role_id === undefined}>
      <SidePanelProvider open={open} onOpenChange={setOpen}>
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
            className={classBase}
            direction="column"
            style={{ flex: "1 1 auto", overflow: "hidden", padding: 8 }}
            gap={8}
          >
            <Toolbar style={{ flex: "0 0 32px" }}>
              <Tooltray>
                <ApplicationFilter
                  onChange={setApplication}
                  value={application}
                />
              </Tooltray>
              <Tooltray align="end">
                <Button className={`${classBase}-add`} onClick={createRole}>
                  Create Role
                </Button>
              </Tooltray>
            </Toolbar>

            <div
              style={{ flex: "1 1 auto", height: "100%", overflow: "hidden" }}
            >
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
              <SidePanelTitle>Role Details</SidePanelTitle>
            </SidePanelHeader>
            <SidePanelContent>
              {dataRow ? (
                <RolesEditForm
                  application={application}
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
