import { Avatar, SidePanelContent, Tag } from "@salt-ds/core";
import { KeyIcon } from "@salt-ds/icons";
import {
  TableEditorForm,
  TableEditorNewButton,
  TableEditorTable,
  EditableTable,
  EditableTablePanel,
  EditableTablePanelHeader,
  EditableTableMain,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AccessTag,
  AppTag,
  AdminToolbar,
  PageHeader,
  PageHeaderActions,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingTags,
  PanelHeadingText,
  PanelHeadingTitle,
  RowCount,
  useApplicationCategory,
} from "../../components/admin-ui/AdminUi";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import {
  CreateRoleForm,
  RoleEditForm,
} from "../../components/roles-edit-form/RolesEditForm";
import { classifyRole } from "../../data/applications";
import { useApplications } from "../../data/useApplicationModel";
import { ROLE_ROW_HEIGHT, useRolesPage } from "./useRolesPage";

const RoleHeading = () => {
  const { mode, selectedRow } = useTableEditor();
  const { applications } = useApplications();
  const isNew = mode === "create";
  const dataRow = isNew ? undefined : selectedRow;
  const match = isNew
    ? undefined
    : classifyRole(
        applications,
        dataRow?.role_name,
        dataRow?.client_identifier,
      );
  const category = useApplicationCategory(match?.application.name);
  return (
    <PanelHeading>
      <Avatar
        aria-hidden
        color={category ? `category-${category}` : "category-20"}
        fallbackIcon={<KeyIcon />}
        size={2}
      />
      <PanelHeadingText>
        <PanelHeadingTitle>
          {isNew ? "New role" : String(dataRow?.role_name ?? "Role")}
        </PanelHeadingTitle>
        {isNew ? (
          <PanelHeadingSubtitle>
            Roles grant what users can do in an application
          </PanelHeadingSubtitle>
        ) : (
          <PanelHeadingTags>
            {match ? <AppTag application={match.application} /> : null}
            {match?.kind === "access" ? (
              <AccessTag>Portal access role</AccessTag>
            ) : match ? (
              <Tag bordered>Application role</Tag>
            ) : (
              <Tag bordered>Unassigned</Tag>
            )}
          </PanelHeadingTags>
        )}
      </PanelHeadingText>
    </PanelHeading>
  );
};

/** Starts creating a role when the page is opened with `?create=true`. */
const CreateRoleFromSearchParams = () => {
  const { startCreate } = useTableEditor();
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get("create") === "true") {
      startCreate();
      const next = new URLSearchParams(params);
      next.delete("create");
      setParams(next, { replace: true });
    }
  }, [params, setParams, startCreate]);
  return null;
};

export const RolesPage = () => {
  const { application, config, dataSource, setApplication } = useRolesPage();
  return (
    <EditableTable dataSource={dataSource} editStrategy="form">
      <CreateRoleFromSearchParams />
      <EditableTableMain className="vuuIdentityAdmin-page">
        <PageHeader
          description="Access roles open an application; application roles grant what users can do in it."
          title="Roles"
        >
          <PageHeaderActions>
            <TableEditorNewButton sentiment="accented">
              <KeyIcon aria-hidden /> Create role
            </TableEditorNewButton>
          </PageHeaderActions>
        </PageHeader>
        <AdminToolbar>
          <ApplicationFilter onChange={setApplication} value={application} />
          <RowCount dataSource={dataSource} noun="role" />
        </AdminToolbar>
        <div className="vuuIdentityAdmin-tableCard">
          <TableEditorTable config={config} rowHeight={ROLE_ROW_HEIGHT} />
        </div>
      </EditableTableMain>
      <EditableTablePanel className="vuuIdentityAdmin-panel">
        <EditableTablePanelHeader>
          <RoleHeading />
        </EditableTablePanelHeader>
        <SidePanelContent>
          <TableEditorForm>
            <RoleEditForm />
          </TableEditorForm>
          <CreateRoleForm application={application} />
        </SidePanelContent>
      </EditableTablePanel>
    </EditableTable>
  );
};
