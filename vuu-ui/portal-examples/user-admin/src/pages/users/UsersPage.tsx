import { Avatar, SidePanelContent, SidePanelHeader, Tag } from "@salt-ds/core";
import {
  TableWithEditFormPanel,
  TableEditorForm,
  TableEditorPanelCloseButton,
  TableWithEditFormTablePanel,
  TableWithEditForm,
  TableWithEditFormTable,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import {
  AdminToolbar,
  PageHeader,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingTags,
  PanelHeadingText,
  PanelHeadingTitle,
  RowCount,
} from "../../components/admin-ui/AdminUi";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import { userDisplayName } from "../../components/UserCells";
import { UserEditForm } from "../../components/user-edit-form/UserEditForm";
import { USER_ROW_HEIGHT } from "./usersTable";
import { useUsersPage } from "./useUsersPage";

const UserHeading = () => {
  const { selectedRow: dataRow } = useTableEditor();
  const name = dataRow ? userDisplayName(dataRow) : "";
  return (
    <PanelHeading>
      <Avatar aria-hidden name={name || undefined} size={2} />
      <PanelHeadingText>
        <PanelHeadingTitle>{name || "User"}</PanelHeadingTitle>
        {typeof dataRow?.email === "string" ? (
          <PanelHeadingSubtitle>{dataRow.email}</PanelHeadingSubtitle>
        ) : null}
        {dataRow ? (
          <PanelHeadingTags>
            {dataRow.enabled === false ? (
              <Tag bordered>Disabled</Tag>
            ) : (
              <Tag category={5}>Enabled</Tag>
            )}
            {dataRow.email_verified === true ? (
              <Tag bordered>Email verified</Tag>
            ) : null}
            {dataRow.password_update_required === true ? (
              <Tag bordered>Password update required</Tag>
            ) : null}
          </PanelHeadingTags>
        ) : null}
      </PanelHeadingText>
    </PanelHeading>
  );
};

export const UsersPage = () => {
  const { application, config, dataSource, setApplication } = useUsersPage();
  return (
    <TableWithEditForm dataSource={dataSource}>
      <TableWithEditFormTablePanel className="vuuIdentityAdmin-page vuuIdentityAdmin-users">
        <PageHeader
          description="Grant application access by adding users to an application's groups."
          title="Users"
        />
        <AdminToolbar>
          <ApplicationFilter
            noAccessLabel="No application access"
            onChange={setApplication}
            value={application}
          />
          <RowCount dataSource={dataSource} noun="user" />
        </AdminToolbar>
        <TableWithEditFormTable config={config} rowHeight={USER_ROW_HEIGHT} />
      </TableWithEditFormTablePanel>
      <TableWithEditFormPanel className="vuuIdentityAdmin-panel">
        <SidePanelHeader>
          <UserHeading />
          <TableEditorPanelCloseButton />
        </SidePanelHeader>
        <SidePanelContent>
          <TableEditorForm>
            <UserEditForm />
          </TableEditorForm>
        </SidePanelContent>
      </TableWithEditFormPanel>
    </TableWithEditForm>
  );
};
