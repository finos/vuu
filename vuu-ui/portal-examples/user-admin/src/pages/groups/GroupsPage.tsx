import { Avatar, SidePanelContent } from "@salt-ds/core";
import { AddIcon, UserGroupIcon } from "@salt-ds/icons";
import {
  TableEditorForm,
  TableEditorNewButton,
  TableWithEditForm,
  TableWithEditFormPanel,
  TableWithEditFormPanelHeader,
  TableWithEditFormTable,
  TableWithEditFormTablePanel,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AdminToolbar,
  AppAvatar,
  PageHeader,
  PageHeaderActions,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingText,
  PanelHeadingTitle,
  RowCount,
  plural,
} from "../../components/admin-ui/AdminUi";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import {
  CreateGroupForm,
  GroupEditForm,
} from "../../components/groups-edit-form/GroupsEditForm";
import {
  applicationForGroupName,
  groupNameFromPath,
} from "../../data/applications";
import { useApplications } from "../../data/useApplicationModel";
import { GROUP_ROW_HEIGHT, useGroupsPage } from "./useGroupsPage";

const GroupHeading = () => {
  const { mode, selectedRow } = useTableEditor();
  const { applications } = useApplications();
  const isNew = mode === "create";
  const dataRow = isNew ? undefined : selectedRow;
  const groupName = groupNameFromPath(dataRow?.group_path);
  const application = applicationForGroupName(applications, groupName);
  const userCount = Number(dataRow?.user_count ?? 0);
  return (
    <PanelHeading>
      {application ? (
        <AppAvatar application={application} size={2} />
      ) : (
        <Avatar
          aria-hidden
          color="category-20"
          fallbackIcon={<UserGroupIcon />}
          size={2}
        />
      )}
      <PanelHeadingText>
        <PanelHeadingTitle>
          {isNew ? "New group" : (groupName ?? "Group")}
        </PanelHeadingTitle>
        <PanelHeadingSubtitle>
          {isNew
            ? "Bundle an application's roles for its users"
            : `${application ? `${application.title} group` : "Unassigned group"} · ${plural(userCount, "member")}`}
        </PanelHeadingSubtitle>
      </PanelHeadingText>
    </PanelHeading>
  );
};

/** Starts creating a group when the page is opened with `?create=true`. */
const CreateGroupFromSearchParams = () => {
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

export const GroupsPage = () => {
  const { application, config, dataSource, setApplication } = useGroupsPage();
  return (
    <TableWithEditForm dataSource={dataSource}>
      <CreateGroupFromSearchParams />
      <TableWithEditFormTablePanel className="vuuIdentityAdmin-page">
        <PageHeader
          description="Each group belongs to one application and bundles its roles."
          title="Groups"
        >
          <PageHeaderActions>
            <TableEditorNewButton sentiment="accented">
              <AddIcon aria-hidden /> Create group
            </TableEditorNewButton>
          </PageHeaderActions>
        </PageHeader>
        <AdminToolbar>
          <ApplicationFilter onChange={setApplication} value={application} />
          <RowCount dataSource={dataSource} noun="group" />
        </AdminToolbar>
        <TableWithEditFormTable config={config} rowHeight={GROUP_ROW_HEIGHT} />
      </TableWithEditFormTablePanel>
      <TableWithEditFormPanel className="vuuIdentityAdmin-panel">
        <TableWithEditFormPanelHeader>
          <GroupHeading />
        </TableWithEditFormPanelHeader>
        <SidePanelContent>
          <TableEditorForm>
            <GroupEditForm />
          </TableEditorForm>
          <CreateGroupForm application={application} />
        </SidePanelContent>
      </TableWithEditFormPanel>
    </TableWithEditForm>
  );
};
