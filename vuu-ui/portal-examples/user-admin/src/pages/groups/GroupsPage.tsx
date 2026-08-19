import { Avatar, Button, SidePanelTitle } from "@salt-ds/core";
import { AddIcon, UserGroupIcon } from "@salt-ds/icons";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  AppAvatar,
  PanelHeading,
  plural,
} from "../../components/admin-ui/AdminUi";
import { AdminTablePage } from "../../components/admin-table-page/AdminTablePage";
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
    <PanelHeading
      avatar={
        application ? (
          <AppAvatar application={application} size={2} />
        ) : (
          <Avatar
            aria-hidden
            color="category-20"
            fallbackIcon={<UserGroupIcon />}
            size={2}
          />
        )
      }
      subtitle={
        isNew
          ? "Bundle an application's roles for its users"
          : `${application ? `${application.title} group` : "Unassigned group"} · ${plural(userCount, "member")}`
      }
      title={
        <SidePanelTitle styleAs="h3">
          {isNew ? "New group" : (groupName ?? "Group")}
        </SidePanelTitle>
      }
    />
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
      <AdminTablePage
        actions={
          <Button onClick={createGroup} sentiment="accented">
            <AddIcon aria-hidden /> Create group
          </Button>
        }
        dataSource={dataSource}
        description="Each group belongs to one application and bundles its roles."
        filter={
          <ApplicationFilter onChange={setApplication} value={application} />
        }
        noun="group"
        onPanelOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
          } else {
            close();
          }
        }}
        panelContent={
          dataRow ? (
            <GroupsEditForm
              application={application}
              dataRow={dataRow}
              dataSource={dataSource}
              onClose={close}
            />
          ) : null
        }
        panelHeading={<GroupHeading dataRow={dataRow} />}
        panelOpen={open}
        table={
          <Table
            config={config}
            dataSource={dataSource}
            onSelect={onSelect}
            rowHeight={GROUP_ROW_HEIGHT}
          />
        }
        title="Groups"
      />
    </EditModeProvider>
  );
};
