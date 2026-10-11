import { Avatar, SidePanelContent, SidePanelHeader, Tag } from "@salt-ds/core";
import {
  TableEditorForm,
  TableEditorPanelCloseButton,
  TableEditorTable,
  TableWithEditForm,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import {
  PageHeader,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingTags,
  PanelHeadingText,
  PanelHeadingTitle,
} from "../../components/admin-ui/AdminUi";
import {
  AdminPage,
  AdminPanel,
  AdminTableCard,
  AdminToolbar,
  adminPageWithPanelClassName,
  RowCount,
} from "../../components/admin-table-page/AdminTablePage";
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
    <TableWithEditForm
      className={adminPageWithPanelClassName}
      dataSource={dataSource}
    >
      <AdminPage>
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
        <AdminTableCard>
          <TableEditorTable config={config} rowHeight={USER_ROW_HEIGHT} />
        </AdminTableCard>
      </AdminPage>
      <AdminPanel>
        <SidePanelHeader>
          <UserHeading />
          <TableEditorPanelCloseButton />
        </SidePanelHeader>
        <SidePanelContent>
          <TableEditorForm showButtons={false}>
            <UserEditForm />
          </TableEditorForm>
        </SidePanelContent>
      </AdminPanel>
    </TableWithEditForm>
  );
};
