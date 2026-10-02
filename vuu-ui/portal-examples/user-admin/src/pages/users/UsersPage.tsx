import { Avatar, SidePanelTitle, Tag } from "@salt-ds/core";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";
import { Table } from "@vuu-ui/vuu-table";
import type { DataRow, TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import { useCallback, useState } from "react";
import { PanelHeading } from "../../components/admin-ui/AdminUi";
import { AdminTablePage } from "../../components/admin-table-page/AdminTablePage";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import { userDisplayName } from "../../components/UserCells";
import { UserEditForm } from "../../components/user-edit-form/UserEditForm";
import { USER_ROW_HEIGHT } from "./usersTable";
import { useUsersPage } from "./useUsersPage";

const UserHeading = ({ dataRow }: { dataRow?: DataRow }) => {
  const name = dataRow ? userDisplayName(dataRow) : "";
  return (
    <PanelHeading
      avatar={<Avatar aria-hidden name={name || undefined} size={2} />}
      subtitle={typeof dataRow?.email === "string" ? dataRow.email : undefined}
      tags={
        dataRow ? (
          <>
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
          </>
        ) : null
      }
      title={<SidePanelTitle styleAs="h3">{name || "User"}</SidePanelTitle>}
    />
  );
};

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
      <AdminTablePage
        dataSource={dataSource}
        description="Grant application access by adding users to an application's groups."
        filter={
          <ApplicationFilter
            noAccessLabel="No application access"
            onChange={setApplication}
            value={application}
          />
        }
        noun="user"
        onPanelOpenChange={setOpen}
        panelContent={
          dataRow ? (
            <UserEditForm dataRow={dataRow} dataSource={dataSource} />
          ) : null
        }
        panelHeading={<UserHeading dataRow={dataRow} />}
        panelOpen={open}
        table={
          <Table
            config={config}
            dataSource={dataSource}
            onSelect={handleSelect}
            rowHeight={USER_ROW_HEIGHT}
          />
        }
        title="Users"
      />
    </EditModeProvider>
  );
};
