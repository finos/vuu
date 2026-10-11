import {
  Avatar,
  Button,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
} from "@salt-ds/core";
import { AddIcon, UserGroupIcon } from "@salt-ds/icons";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  AppAvatar,
  PageHeader,
  PageHeaderActions,
  PanelHeading,
  PanelHeadingSubtitle,
  PanelHeadingText,
  PanelHeadingTitle,
  plural,
} from "../../components/admin-ui/AdminUi";
import {
  AdminPage,
  AdminPageWithPanel,
  AdminPanel,
  AdminTableCard,
  AdminToolbar,
  RowCount,
} from "../../components/admin-table-page/AdminTablePage";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import { GroupsEditForm } from "../../components/groups-edit-form/GroupsEditForm";
import {
  applicationForGroupName,
  groupNameFromPath,
} from "../../data/applications";
import { useApplications } from "../../data/useApplicationModel";
import { GROUP_ROW_HEIGHT, useGroupsPage } from "./useGroupsPage";

const GroupHeading = ({ dataRow }: { dataRow?: DataRow }) => {
  const { applications } = useApplications();
  const isNew = dataRow?.group_id === undefined;
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

export const GroupsPage = () => {
  const {
    application,
    close,
    config,
    createGroup,
    dataRow,
    dataSource,
    onSelect,
    open,
    setApplication,
    setOpen,
  } = useGroupsPage();

  return (
    <EditModeProvider isEditMode={dataRow && dataRow.group_id === undefined}>
      <AdminPageWithPanel
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
          } else {
            close();
          }
        }}
        open={open}
      >
        <AdminPage>
          <PageHeader
            description="Each group belongs to one application and bundles its roles."
            title="Groups"
          >
            <PageHeaderActions>
              <Button onClick={createGroup} sentiment="accented">
                <AddIcon aria-hidden /> Create group
              </Button>
            </PageHeaderActions>
          </PageHeader>
          <AdminToolbar>
            <ApplicationFilter onChange={setApplication} value={application} />
            <RowCount dataSource={dataSource} noun="group" />
          </AdminToolbar>
          <AdminTableCard>
            <Table
              config={config}
              dataSource={dataSource}
              onSelect={onSelect}
              rowHeight={GROUP_ROW_HEIGHT}
            />
          </AdminTableCard>
        </AdminPage>
        <AdminPanel>
          <SidePanelHeader>
            <GroupHeading dataRow={dataRow} />
            <SidePanelCloseButton />
          </SidePanelHeader>
          <SidePanelContent>
            {dataRow ? (
              <GroupsEditForm
                application={application}
                dataRow={dataRow}
                dataSource={dataSource}
                onClose={close}
              />
            ) : null}
          </SidePanelContent>
        </AdminPanel>
      </AdminPageWithPanel>
    </EditModeProvider>
  );
};
