import { Avatar, Button, SidePanelTitle, Tag } from "@salt-ds/core";
import { KeyIcon } from "@salt-ds/icons";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  AccessTag,
  AppTag,
  PanelHeading,
  useApplicationCategory,
} from "../../components/admin-ui/AdminUi";
import { AdminTablePage } from "../../components/admin-table-page/AdminTablePage";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import { RolesEditForm } from "../../components/roles-edit-form/RolesEditForm";
import { classifyRole } from "../../data/applications";
import { useApplications } from "../../data/useApplicationModel";
import { ROLE_ROW_HEIGHT, useRolesPage } from "./useRolesPage";

const RoleHeading = ({ dataRow }: { dataRow?: DataRow }) => {
  const { applications } = useApplications();
  const isNew = dataRow?.role_id === undefined;
  const match = isNew
    ? undefined
    : classifyRole(
        applications,
        dataRow?.role_name,
        dataRow?.client_identifier,
      );
  const category = useApplicationCategory(match?.application.name);
  return (
    <PanelHeading
      avatar={
        <Avatar
          aria-hidden
          color={category ? `category-${category}` : "category-20"}
          fallbackIcon={<KeyIcon />}
          size={2}
        />
      }
      subtitle={
        isNew ? "Roles grant what users can do in an application" : undefined
      }
      tags={
        isNew ? null : (
          <>
            {match ? <AppTag application={match.application} /> : null}
            {match?.kind === "access" ? (
              <AccessTag>Portal access role</AccessTag>
            ) : match ? (
              <Tag bordered>Application role</Tag>
            ) : (
              <Tag bordered>Unassigned</Tag>
            )}
          </>
        )
      }
      title={
        <SidePanelTitle styleAs="h3">
          {isNew ? "New role" : String(dataRow?.role_name ?? "Role")}
        </SidePanelTitle>
      }
    />
  );
};

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
      <AdminTablePage
        actions={
          <Button onClick={createRole} sentiment="accented">
            <KeyIcon aria-hidden /> Create role
          </Button>
        }
        dataSource={dataSource}
        description="Access roles open an application; application roles grant what users can do in it."
        filter={
          <ApplicationFilter onChange={setApplication} value={application} />
        }
        noun="role"
        onPanelOpenChange={setOpen}
        panelContent={
          dataRow ? (
            <RolesEditForm
              application={application}
              dataRow={dataRow}
              dataSource={dataSource}
              onClose={close}
            />
          ) : null
        }
        panelHeading={<RoleHeading dataRow={dataRow} />}
        panelOpen={open}
        table={
          <Table
            config={config}
            dataSource={dataSource}
            onSelect={onSelect}
            rowHeight={ROLE_ROW_HEIGHT}
          />
        }
        title="Roles"
      />
    </EditModeProvider>
  );
};
